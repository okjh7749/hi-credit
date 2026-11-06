import { AppDatabase } from './types';

export const RAW_KAKAO_MEMO = `하나 제이드 25.8.7 발급  (혜택제공 12개월 해지금지 -> 26.12.31) or (혜택제공 12개월 해지금지 -> 27.09.31)
bc 카픽 25.11.13 발급  (혜택제공 12개월 해지금지 -> 27.05.31)
우리 우카정 26.5.18 발급 (혜택제공 12개월 해지금지 -> 27.07.31) or (혜택제공 12개월 해지금지 -> 27.09.31)
현대 현아골2 26.9.22 발급 해지금지 (혜택제공 12개월 해지금지 -> 27.11.31)
기업 포인트카드 26.10.13 발급 해지금지 (혜택제공 12개월 해지금지 ->28.01.31)
롯카 해지가능 26.1 마지막사용 (이전 12개월 혜택 및 6개월 결제이력 )
삼카 해지가능  26.7 마지막사용 (혜택 이후 5년 / 가입일 확인필요)
국민 미해지 26.9.15 마지막 사용

신
농

자동이체정리
mgs
1. lgu+ 2.59 
2. 네이버 멤버쉽 4500 /25일
3. 쿠팡 멤버쉽 7890 /15일
4. m모바일 1.63 /11일
5. m모바일 2.12/11일


lg 티플러스 26.08.25 가입 유심
6306
25900
무제한

kt m모바일 26.08.13 가입 아이폰유심

16300
27년 5월 3.5만 + 밀리의서제

kt m 모바일 26.09.01 가입 이심
21200
27년 6월 6만 + 쿠팡 5천원`;

export const INITIAL_DB: AppDatabase = {
  version: 1,
  updatedAt: new Date().toISOString(),
  settings: {
    referenceDateMode: 'system',
    customReferenceDate: '2026-11-06',
    usdToKrwRate: 1400,
    paymentGroups: ['mgs', '하나 제이드', '우리 우카정', '현대 현아골2', '기업 포인트카드', 'BC 카픽', '계좌자동이체'],
  },
  cards: [
    {
      id: 'card-hana-jade',
      issuer: '하나카드',
      cardName: '하나 제이드 (JADE)',
      status: 'locked',
      issueDate: '2025-08-07',
      lockEndDatePrimary: '2026-12-31',
      lockEndDateSecondary: '2027-09-30',
      rewardReceived: true,
      clawbackRule: '혜택제공 후 12개월 해지금지 (26.12.31 또는 보수적 27.09.31)',
      memo: '원문: 하나 제이드 25.8.7 발급 (혜택제공 12개월 해지금지 -> 26.12.31) or (혜택제공 12개월 해지금지 -> 27.09.31)',
      customFields: [
        { key: '보수적 만기표기', value: '27.09.31 (9월 말일)' },
      ],
    },
    {
      id: 'card-bc-kapick',
      issuer: 'BC카드',
      cardName: 'BC 카픽 (K-Pick)',
      status: 'locked',
      issueDate: '2025-11-13',
      lockEndDatePrimary: '2027-05-31',
      rewardReceived: true,
      clawbackRule: '혜택제공 후 12개월 해지금지 (-> 27.05.31)',
      memo: '원문: bc 카픽 25.11.13 발급 (혜택제공 12개월 해지금지 -> 27.05.31)',
      customFields: [],
    },
    {
      id: 'card-woori-jung',
      issuer: '우리카드',
      cardName: '우리 우카정 (카드의정석)',
      status: 'locked',
      issueDate: '2026-05-18',
      lockEndDatePrimary: '2027-07-31',
      lockEndDateSecondary: '2027-09-30',
      rewardReceived: true,
      clawbackRule: '혜택제공 후 12개월 해지금지 (27.07.31 또는 27.09.31)',
      memo: '원문: 우리 우카정 26.5.18 발급 (혜택제공 12개월 해지금지 -> 27.07.31) or (혜택제공 12개월 해지금지 -> 27.09.31)',
      customFields: [],
    },
    {
      id: 'card-hyundai-amex2',
      issuer: '현대카드',
      cardName: '현대 현아골2 (아멕스 골드 2)',
      status: 'locked',
      issueDate: '2026-09-22',
      lockEndDatePrimary: '2027-11-30',
      rewardReceived: true,
      clawbackRule: '혜택제공 후 12개월 해지금지 (-> 27.11.31)',
      memo: '원문: 현대 현아골2 26.9.22 발급 해지금지 (혜택제공 12개월 해지금지 -> 27.11.31)',
      customFields: [],
    },
    {
      id: 'card-ibk-point',
      issuer: 'IBK기업카드',
      cardName: '기업 포인트카드',
      status: 'locked',
      issueDate: '2026-10-13',
      lockEndDatePrimary: '2028-01-31',
      rewardReceived: true,
      clawbackRule: '혜택제공 후 12개월 해지금지 (-> 28.01.31)',
      memo: '원문: 기업 포인트카드 26.10.13 발급 해지금지 (혜택제공 12개월 해지금지 ->28.01.31)',
      customFields: [],
    },
    {
      id: 'card-lotte',
      issuer: '롯데카드',
      cardName: '롯데카드 (기존 보유)',
      status: 'cancellable',
      lastUsedDate: '2026-01-31',
      reTargetDate: '2026-08-01',
      clawbackRule: '이전 12개월 혜택 및 6개월 결제이력 무실적 조건',
      memo: '원문: 롯카 해지가능 26.1 마지막사용 (이전 12개월 혜택 및 6개월 결제이력 ) — 6개월 무실적 경과 완료',
      customFields: [],
    },
    {
      id: 'card-samsung',
      issuer: '삼성카드',
      cardName: '삼성카드 (기존 보유)',
      status: 'cancellable',
      lastUsedDate: '2026-07-31',
      reTargetDate: '2027-02-01',
      clawbackRule: '혜택 이후 5년 제한 여부 / 가입일 확인 필요',
      memo: '원문: 삼카 해지가능 26.7 마지막사용 (혜택 이후 5년 / 가입일 확인필요)',
      customFields: [
        { key: '체크사항', value: '고객센터/앱에서 최초 가입일 및 5년 이내 프로모션 이력 확인' },
      ],
    },
    {
      id: 'card-kb',
      issuer: 'KB국민카드',
      cardName: '국민카드 (미해지)',
      status: 'cooldown',
      lastUsedDate: '2026-09-15',
      reTargetDate: '2027-03-16',
      clawbackRule: '마지막 사용일(26.9.15) 이후 6개월 무실적 대기 또는 해지 필요',
      memo: '원문: 국민 미해지 26.9.15 마지막 사용',
      customFields: [],
    },
    {
      id: 'card-shinhan-target',
      issuer: '신한카드',
      cardName: '신한카드 (신규 이벤트 타겟)',
      status: 'target',
      clawbackRule: '직전 6개월 무실적 / 12개월 이벤트 미수령 시 진입 가능',
      memo: '원문 메모: "신" — 신규 발급 이벤트 타겟 대기 카드사',
      customFields: [],
    },
    {
      id: 'card-nh-target',
      issuer: 'NH농협카드',
      cardName: '농협카드 (신규 이벤트 타겟)',
      status: 'target',
      clawbackRule: '직전 6개월 무실적 조건 확인 후 신규 이벤트 응모 가능',
      memo: '원문 메모: "농" — 신규 발급 이벤트 타겟 대기 카드사',
      customFields: [],
    },
  ],
  mvnos: [
    {
      id: 'mvno-lg-tplus-6306',
      provider: 'LG 티플러스 (tplus)',
      network: 'LGU+망',
      lineLabel: '유심 무제한 회선 (6306)',
      phoneTail: '6306',
      simType: 'USIM',
      joinDate: '2026-08-25',
      minKeepDate: '2026-11-25',
      currentFee: 25900,
      dataSpec: '무제한',
      paymentGroup: 'mgs',
      isActive: true,
      memo: '원문: lg 티플러스 26.08.25 가입 유심 / 6306 / 25900 / 무제한',
      customFields: [],
    },
    {
      id: 'mvno-ktm-iphone',
      provider: 'KT M모바일',
      network: 'KT망',
      lineLabel: '아이폰 유심 회선',
      simType: 'USIM',
      joinDate: '2026-08-13',
      minKeepDate: '2026-11-13',
      currentFee: 16300,
      afterFee: 35000,
      priceJumpDate: '2027-05-01',
      billingDay: 11,
      paymentGroup: 'mgs',
      monthlyPerks: '밀리의서재 무료',
      isActive: true,
      memo: '원문: kt m모바일 26.08.13 가입 아이폰유심 / 16300 / 27년 5월 3.5만 + 밀리의서제 (27년 5월 요금 인상 전 번호이동/해지 권장)',
      customFields: [],
    },
    {
      id: 'mvno-ktm-esim',
      provider: 'KT M모바일',
      network: 'KT망',
      lineLabel: '이심(eSIM) 회선',
      simType: 'eSIM',
      joinDate: '2026-09-01',
      minKeepDate: '2026-12-01',
      currentFee: 21200,
      afterFee: 60000,
      priceJumpDate: '2027-06-01',
      billingDay: 11,
      paymentGroup: 'mgs',
      monthlyPerks: '매월 쿠팡 5천원',
      isActive: true,
      memo: '원문: kt m 모바일 26.09.01 가입 이심 / 21200 / 27년 6월 6만 + 쿠팡 5천원 (27년 6월 6만원 인상 전 번이/해지 필수)',
      customFields: [],
    },
  ],
  transfers: [
    {
      id: 'sub-lgu-25900',
      title: '1. LGU+ (티플러스 6306)',
      category: '통신/알뜰폰',
      amount: 25900,
      currency: 'KRW',
      billingCycle: 'monthly',
      paymentMethod: 'mgs',
      linkedMvnoId: 'mvno-lg-tplus-6306',
      accountInfo: '뒷번호 6306 무제한 유심',
      isActive: true,
      memo: '원문: 자동이체정리 mgs 1. lgu+ 2.59',
      customFields: [],
    },
    {
      id: 'sub-naver-membership',
      title: '2. 네이버플러스 멤버십',
      category: '멤버십/쇼핑',
      amount: 4500,
      currency: 'KRW',
      billingCycle: 'monthly',
      billingDay: 25,
      paymentMethod: 'mgs',
      isActive: true,
      memo: '원문: 자동이체정리 mgs 2. 네이버 멤버쉽 4500 /25일',
      customFields: [],
    },
    {
      id: 'sub-coupang-wow',
      title: '3. 쿠팡 와우 멤버십',
      category: '멤버십/쇼핑',
      amount: 7890,
      currency: 'KRW',
      billingCycle: 'monthly',
      billingDay: 15,
      paymentMethod: 'mgs',
      isActive: true,
      memo: '원문: 자동이체정리 mgs 3. 쿠팡 멤버쉽 7890 /15일',
      customFields: [],
    },
    {
      id: 'sub-mmobile-16300',
      title: '4. KT M모바일 (아이폰유심)',
      category: '통신/알뜰폰',
      amount: 16300,
      currency: 'KRW',
      billingCycle: 'monthly',
      billingDay: 11,
      paymentMethod: 'mgs',
      linkedMvnoId: 'mvno-ktm-iphone',
      accountInfo: '밀리의서재 혜택 포함 / 27.05 인상 주의',
      isActive: true,
      memo: '원문: 자동이체정리 mgs 4. m모바일 1.63 /11일',
      customFields: [],
    },
    {
      id: 'sub-mmobile-21200',
      title: '5. KT M모바일 (이심)',
      category: '통신/알뜰폰',
      amount: 21200,
      currency: 'KRW',
      billingCycle: 'monthly',
      billingDay: 11,
      paymentMethod: 'mgs',
      linkedMvnoId: 'mvno-ktm-esim',
      accountInfo: '쿠팡 5천원 혜택 포함 / 27.06 인상 주의',
      isActive: true,
      memo: '원문: 자동이체정리 mgs 5. m모바일 2.12/11일',
      customFields: [],
    },
  ],
};

export interface AiPreset {
  title: string;
  category: 'AI 구독' | '멤버십/쇼핑' | 'OTT/콘텐츠' | '클라우드/SW';
  amount: number;
  currency: 'USD' | 'KRW';
  billingCycle: 'monthly' | 'yearly';
  memo: string;
}

export const AI_AND_SUB_PRESETS: AiPreset[] = [
  {
    title: 'ChatGPT Plus (OpenAI)',
    category: 'AI 구독',
    amount: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: 'OpenAI ChatGPT Plus 월간 구독 ($20 / 부가세 포함 시 약 $22)',
  },
  {
    title: 'ChatGPT Pro (OpenAI)',
    category: 'AI 구독',
    amount: 200,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: 'OpenAI ChatGPT Pro 무제한 플랜 ($200/월)',
  },
  {
    title: 'Claude Pro (Anthropic)',
    category: 'AI 구독',
    amount: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: 'Anthropic Claude Pro 월간 구독 ($20/월)',
  },
  {
    title: 'Claude Max (Anthropic)',
    category: 'AI 구독',
    amount: 100,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: 'Anthropic Claude Max 5x 플랜 ($100/월)',
  },
  {
    title: 'Google One AI Premium (Gemini)',
    category: 'AI 구독',
    amount: 29000,
    currency: 'KRW',
    billingCycle: 'monthly',
    memo: 'Gemini Advanced + 2TB 클라우드 스토리지',
  },
  {
    title: 'Cursor Pro',
    category: 'AI 구독',
    amount: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: 'AI 코드 에디터 Cursor Pro ($20/월)',
  },
  {
    title: 'Perplexity Pro',
    category: 'AI 구독',
    amount: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: 'AI 검색 Perplexity Pro ($20/월, 통신사/카드 제휴 프로모션 여부 확인)',
  },
  {
    title: 'GitHub Copilot Pro',
    category: 'AI 구독',
    amount: 10,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: 'GitHub Copilot 개인 구독 ($10/월)',
  },
  {
    title: 'Midjourney Standard',
    category: 'AI 구독',
    amount: 30,
    currency: 'USD',
    billingCycle: 'monthly',
    memo: '이미지 생성 AI Midjourney ($30/월)',
  },
  {
    title: 'YouTube Premium',
    category: 'OTT/콘텐츠',
    amount: 14900,
    currency: 'KRW',
    billingCycle: 'monthly',
    memo: '유튜브 프리미엄 개인 멤버십',
  },
];
