export type CardStatus =
  | 'locked'       // 유지필수 (해지금지 기간 중)
  | 'cancellable'  // 해지가능 (유지기간 만료 또는 정리 대상)
  | 'cooldown'     // 쿨타임 진행중 (무실적/탈회 후 대기)
  | 'target';      // 신규타겟 후보 (이벤트 진입 가능)

export interface CustomField {
  key: string;
  value: string;
}

export interface CardEventItem {
  id: string;
  issuer: string;              // 카드사 (하나, BC, 우리, 현대, 기업, 롯데, 삼성, 국민, 신한, 농협 등)
  cardName: string;            // 카드명 (제이드, 카픽, 우카정, 현아골2 등)
  status: CardStatus;          // 상태
  issueDate?: string;          // 발급일 (YYYY-MM-DD)
  lastUsedDate?: string;       // 마지막 사용일 (YYYY-MM-DD)
  cancelledDate?: string;      // 해지/탈회 완료일 (YYYY-MM-DD)
  lockEndDatePrimary?: string; // 해지가능일 (1차 기준, YYYY-MM-DD)
  lockEndDateSecondary?: string; // 해지가능일 (2차/보수적 기준, YYYY-MM-DD)
  reTargetDate?: string;       // 신규이벤트 재진입 가능 예상일 (YYYY-MM-DD)
  rewardAmount?: number;       // 혜택 금액 (원, 예: 150000)
  rewardReceived?: boolean;    // 혜택 수령 완료 여부
  spendRequirement?: string;   // 실적/이벤트 조건 (예: 발급월+1개월 내 15만원 사용)
  clawbackRule?: string;       // 해지금지 조건 (예: 혜택제공 후 12개월 해지금지)
  annualFee?: number;          // 연회비 (원)
  memo?: string;               // 상세 메모 (원문 메모 포함)
  customFields?: CustomField[]; // 확장성을 위한 사용자 정의 필드
}

export type SimType = 'USIM' | 'eSIM';
export type NetworkCarrier = 'KT망' | 'LGU+망' | 'SKT망' | '기타';
export type MvnoStatus = 'active' | 'Warning' | 'ported_out';

export interface MvnoEventItem {
  id: string;
  provider: string;            // 알뜰폰 통신사 (KT M모바일, LG 티플러스 등)
  network: NetworkCarrier;     // 통신망 (KT망, LGU+망, SKT망)
  lineLabel: string;           // 회선 별칭/용도 (예: 아이폰유심, 이심, 메인회선)
  phoneTail?: string;          // 전화번호 뒷자리 (예: 6306)
  simType: SimType;            // USIM | eSIM
  joinDate: string;            // 가입/개통일 (YYYY-MM-DD)
  minKeepDate?: string;        // 의무유지/중립기관 권고일 (YYYY-MM-DD, 보통 개통+93일 또는 185일)
  currentFee: number;          // 현재 프로모션 월 요금 (원)
  afterFee?: number;           // 할인 종료 후 인상 요금 (원)
  priceJumpDate?: string;      // 요금 인상(번이 타이밍) 예정일 (YYYY-MM-DD)
  billingDay?: number;         // 자동이체 출금일 (예: 11일)
  paymentGroup?: string;       // 연결된 결제수단/그룹 (예: mgs)
  dataSpec?: string;           // 데이터/통화 스펙 (예: 무제한, 11GB+일2GB)
  monthlyPerks?: string;       // 매월 제공 부가혜택 (예: 밀리의서재, 쿠팡 5천원)
  signupGift?: string;         // 신규가입 사은품/상품권 메모
  isActive: boolean;           // 현재 유지 중 여부
  memo?: string;
  customFields?: CustomField[];
}

export type SubCategory =
  | 'AI 구독'
  | '통신/알뜰폰'
  | '멤버십/쇼핑'
  | 'OTT/콘텐츠'
  | '클라우드/SW'
  | '공과금/보험'
  | '기타';

export type CurrencyCode = 'KRW' | 'USD';
export type BillingCycle = 'monthly' | 'yearly';

export interface AutoTransferItem {
  id: string;
  title: string;               // 항목명 (예: lgu+, 네이버 멤버쉽, ChatGPT Plus)
  category: SubCategory;       // 분류
  amount: number;              // 결제 금액 (KRW 원 또는 USD 달러)
  currency: CurrencyCode;      // 통화 ('KRW' | 'USD')
  billingCycle: BillingCycle;  // 결제 주기 ('monthly' | 'yearly')
  billingDay?: number;         // 매월 결제일 (1~31, 미지정 가능)
  paymentMethod: string;       // 결제수단/그룹명 (예: mgs, 현대 현아골2, 우리카드 등)
  linkedMvnoId?: string;       // 알뜰폰 회선과 연동된 경우 ID
  linkedCardId?: string;       // 특정 카드 실적용으로 연동된 경우 ID
  accountInfo?: string;        // 로그인 계정 또는 회선 정보
  nextCancelCheckDate?: string; // 해지/점검 알림일 (YYYY-MM-DD)
  isActive: boolean;           // 활성 여부
  memo?: string;
  customFields?: CustomField[];
}

export interface AppSettings {
  referenceDateMode: 'system' | 'custom';
  customReferenceDate: string; // YYYY-MM-DD
  usdToKrwRate: number;        // 환율 (기본 1400원)
  paymentGroups: string[];     // 등록된 결제수단/자동이체 그룹 태그 (예: ['mgs', '현대 현아골2', '하나 제이드', '국민카드', '계좌이체'])
}

export interface AppDatabase {
  version: number;
  updatedAt: string;
  settings: AppSettings;
  cards: CardEventItem[];
  mvnos: MvnoEventItem[];
  transfers: AutoTransferItem[];
}
