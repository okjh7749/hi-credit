export interface IssuerRule {
  issuer: string;          // 카드사명 (예: 하나, BC, 우리, 현대, 기업, 롯데, 삼성, 국민, 신한, 농협)
  keepMonths: number;      // 해지금지 유지기간 M+N개월 (기본 12)
  noUseMonths: number;     // 무사용(무실적) 기간 N개월 (기본 6)
  noBenefitYears: number;  // 몇 년 이후 혜택 미수령자 조건 N년 (기본 1, 삼성 5)
}

export interface CardItem {
  id: string;
  issuer: string;          // 카드사
  name: string;            // 카드명 (예: 제이드, 카픽, 우카정)
  issueDate?: string;      // 발급일 (YYYY-MM-DD)
  benefitDate?: string;    // 혜택수령일 (YYYY-MM-DD)
  lastUsedDate?: string;   // 마지막사용일 (YYYY-MM-DD)
  keepMonths: number;      // M+N 설정 (예: 12 -> 혜택수령월 + 12개월 말일)
  noUseMonths: number;     // 무사용 N개월
  noBenefitYears: number;  // 혜택미수령 N년
  isCancelled?: boolean;   // 해지완료 여부
  note?: string;           // 짧은 메모 (예: 보수적 27.09.30 등)
}

export interface MvnoItem {
  id: string;
  provider: string;        // 통신사 (예: lg 티플러스, kt m모바일)
  lineName: string;        // 회선구분 (예: 유심 6306, 아이폰유심, 이심)
  joinDate: string;        // 가입일 (YYYY-MM-DD)
  currentFee: number;      // 현재 월요금 (원)
  jumpDate?: string;       // 인상월/예정일 (YYYY-MM-DD)
  jumpFee?: number;        // 인상 후 요금 (원)
  benefit?: string;        // 혜택/메모 (예: 무제한, 밀리의서재, 쿠팡 5천원)
}

export interface AutoTransferItem {
  id: string;
  category: string;        // 사용자 정의 카테고리 (예: mgs, 통신비, 멤버십, AI/구독 등)
  title: string;           // 항목명 (예: lgu+, 네이버 멤버쉽, 쿠팡 멤버쉽)
  amount: number;          // 금액
  currency: 'KRW' | 'USD'; // 원화 / 달러
  billingDay?: number;     // 결제일 (1~31일)
  memo?: string;           // 간단 메모
}

export interface AppDatabase {
  version: number;
  updatedAt: string;
  usdRate: number;
  issuerRules: IssuerRule[];
  cards: CardItem[];
  mvnos: MvnoItem[];
  transferCategories: string[];
  transfers: AutoTransferItem[];
}
