import { AutoTransferItem, CardEventItem, MvnoEventItem } from '../types';

function normalizeShortDate(raw: string, preferEndOfMonth = false): string | undefined {
  const clean = raw.trim().replace(/\s+/g, '');
  const m = clean.match(/^(\d{2,4})\.(\d{1,2})(?:\.(\d{1,2}))?$/);
  if (!m) return undefined;
  let year = parseInt(m[1], 10);
  if (year < 100) year += 2000;
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12) return undefined;

  const maxDayOfMonth = new Date(year, month, 0).getDate();
  let day = m[3] ? parseInt(m[3], 10) : preferEndOfMonth ? maxDayOfMonth : 1;
  if (day > maxDayOfMonth) day = maxDayOfMonth;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface ParsedMemoResult {
  cards: CardEventItem[];
  mvnos: MvnoEventItem[];
  transfers: AutoTransferItem[];
}

export function parseFreeformMemo(text: string): ParsedMemoResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const cards: CardEventItem[] = [];
  const mvnos: MvnoEventItem[] = [];
  const transfers: AutoTransferItem[] = [];

  let currentSection: 'card' | 'transfer' | 'mvno' = 'card';
  let currentPaymentGroup = 'mgs';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('자동이체')) {
      currentSection = 'transfer';
      continue;
    }

    if (
      /^(lg|kt|sk|티플러스|m모바일|엠모바일|리브엠|유모바일|헬로모바일)/i.test(line) &&
      line.includes('가입')
    ) {
      currentSection = 'mvno';
    }

    if (currentSection === 'transfer') {
      // Check if it's a group header like 'mgs'
      if (/^[a-zA-Z가-힣0-9_-]{2,12}$/.test(line) && !/\d/.test(line)) {
        currentPaymentGroup = line;
        continue;
      }

      // Check numbered transfer line like: "2. 네이버 멤버쉽 4500 /25일" or "1. lgu+ 2.59"
      const transMatch = line.match(/^(?:\d+\.\s*)?(.+?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d{1,2})일)?$/);
      if (transMatch) {
        const rawTitle = transMatch[1].trim();
        const rawNum = parseFloat(transMatch[2]);
        const billingDay = transMatch[3] ? parseInt(transMatch[3], 10) : undefined;
        // If decimal like 2.59 or 1.63 -> multiply by 10000 (만원 단위)
        const amount = rawNum < 100 ? Math.round(rawNum * 10000) : Math.round(rawNum);
        const isTelecom = /lgu|kt|sk|모바일|티플러스|통신/i.test(rawTitle);

        transfers.push({
          id: `parsed-sub-${Date.now()}-${i}`,
          title: rawTitle,
          category: isTelecom ? '통신/알뜰폰' : '멤버십/쇼핑',
          amount,
          currency: 'KRW',
          billingCycle: 'monthly',
          billingDay,
          paymentMethod: currentPaymentGroup,
          isActive: true,
          memo: `메모 자동추출: ${line}`,
          customFields: [],
        });
        continue;
      }
    }

    // Check MVNO block start
    if (
      /^(lg|kt|sk|티플러스|m모바일|엠모바일)/i.test(line) &&
      line.includes('가입')
    ) {
      const dateMatch = line.match(/(\d{2,4}\.\d{1,2}\.\d{1,2})/);
      const joinDate = dateMatch ? normalizeShortDate(dateMatch[1]) || '2026-08-01' : '2026-08-01';
      const isEsim = line.includes('이심') || /esim/i.test(line);
      const network = /^lg|티플러스/i.test(line)
        ? 'LGU+망'
        : /^kt|m모바일/i.test(line)
        ? 'KT망'
        : 'SKT망';

      let phoneTail: string | undefined;
      let currentFee = 0;
      let afterFee: number | undefined;
      let priceJumpDate: string | undefined;
      let monthlyPerks: string | undefined;
      let dataSpec: string | undefined;

      // Look ahead up to 3 lines for MVNO details
      let lookahead = 1;
      while (i + lookahead < lines.length && lookahead <= 3) {
        const nextLine = lines[i + lookahead];
        if (/^(lg|kt|sk)/i.test(nextLine) && nextLine.includes('가입')) break;

        if (/^\d{4}$/.test(nextLine) && !phoneTail) {
          phoneTail = nextLine;
        } else if (/^\d{4,6}$/.test(nextLine) && currentFee === 0) {
          currentFee = parseInt(nextLine, 10);
        } else if (nextLine.includes('무제한') || nextLine.includes('GB')) {
          dataSpec = nextLine;
        } else if (nextLine.includes('년') && nextLine.includes('월')) {
          const ymMatch = nextLine.match(/(\d{2,4})년\s*(\d{1,2})월/);
          if (ymMatch) {
            let y = parseInt(ymMatch[1], 10);
            if (y < 100) y += 2000;
            const m = parseInt(ymMatch[2], 10);
            priceJumpDate = `${y}-${String(m).padStart(2, '0')}-01`;
          }
          const feeMatch = nextLine.match(/(\d+(?:\.\d+)?)만/);
          if (feeMatch) {
            afterFee = Math.round(parseFloat(feeMatch[1]) * 10000);
          }
          const plusParts = nextLine.split('+');
          if (plusParts.length > 1) {
            monthlyPerks = plusParts.slice(1).join('+').trim();
          }
        }
        lookahead++;
      }
      i += lookahead - 1;

      mvnos.push({
        id: `parsed-mvno-${Date.now()}-${i}`,
        provider: line.split(/\d/)[0].trim(),
        network,
        lineLabel: line.replace(/^.*가입\s*/, '').trim() || '알뜰폰 회선',
        phoneTail,
        simType: isEsim ? 'eSIM' : 'USIM',
        joinDate,
        currentFee,
        afterFee,
        priceJumpDate,
        dataSpec,
        monthlyPerks,
        paymentGroup: currentPaymentGroup,
        isActive: true,
        memo: `메모 자동추출: ${line}`,
        customFields: [],
      });
      continue;
    }

    // Card lines
    if (line.length <= 2 && /^[가-힣]+$/.test(line)) {
      const issuerMap: Record<string, string> = {
        신: '신한카드',
        농: 'NH농협카드',
        삼: '삼성카드',
        현: '현대카드',
        롯: '롯데카드',
        국: 'KB국민카드',
        우: '우리카드',
        하: '하나카드',
      };
      const issuer = issuerMap[line] || `${line}카드`;
      cards.push({
        id: `parsed-card-${Date.now()}-${i}`,
        issuer,
        cardName: `${issuer} (신규 타겟 후보)`,
        status: 'target',
        memo: `메모 자동추출: "${line}"`,
        customFields: [],
      });
      continue;
    }

    if (line.includes('발급') || line.includes('해지') || line.includes('마지막')) {
      const arrowMatches = [...line.matchAll(/->\s*(\d{2,4}\.\d{1,2}(?:\.\d{1,2})?)/g)];
      const lockEndDatePrimary = arrowMatches[0]
        ? normalizeShortDate(arrowMatches[0][1], true)
        : undefined;
      const lockEndDateSecondary = arrowMatches[1]
        ? normalizeShortDate(arrowMatches[1][1], true)
        : undefined;

      const issueMatch = line.match(/(\d{2,4}\.\d{1,2}(?:\.\d{1,2})?)\s*발급/);
      const lastUseMatch = line.match(/(\d{2,4}\.\d{1,2}(?:\.\d{1,2})?)\s*마지막\s*사용/);

      const issueDate = issueMatch ? normalizeShortDate(issueMatch[1], false) : undefined;
      const lastUsedDate = lastUseMatch ? normalizeShortDate(lastUseMatch[1], true) : undefined;

      const namePart = line
        .split(/\d{2,4}\.\d{1,2}/)[0]
        .replace(/(해지가능|미해지|해지금지)/g, '')
        .trim();
      const tokens = namePart.split(/\s+/);
      const issuer = tokens[0] || '기타카드';
      const cardName = namePart || issuer;

      const status = line.includes('해지가능')
        ? 'cancellable'
        : line.includes('미해지')
        ? 'cooldown'
        : 'locked';

      cards.push({
        id: `parsed-card-${Date.now()}-${i}`,
        issuer,
        cardName,
        status,
        issueDate,
        lastUsedDate,
        lockEndDatePrimary,
        lockEndDateSecondary,
        rewardReceived: status === 'locked',
        clawbackRule: line.includes('(') ? line.slice(line.indexOf('(')) : undefined,
        memo: `원문: ${line}`,
        customFields: [],
      });
    }
  }

  return { cards, mvnos, transfers };
}
