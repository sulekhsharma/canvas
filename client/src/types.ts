export interface ElementBase {
    id: string;
    type: 'text' | 'qr' | 'logo' | 'star-rating' | 'decoration' | 'icon-row' | 'group';
    x: number;
    y: number;
}

export interface DecorationElement extends ElementBase {
    type: 'decoration';
    width: number;
    height: number;
    color?: string;
    borderRadius?: number;
    borderWidth?: number;
    strokeColor?: string;
}

export interface TextElement extends ElementBase {
    type: 'text';
    field?: string;
    content?: string;
    fontSize: number;
    fontFamily: string;
    fontWeight?: string;
    align: 'left' | 'center' | 'right';
    color: string;
    rotation?: number;
    lineHeight?: number;
}

export interface QRElement extends ElementBase {
    type: 'qr';
    size: number;
    errorCorrection: 'L' | 'M' | 'Q' | 'H';
    includeLogo?: boolean;
    logoPadding?: number;
    logoShape?: 'square' | 'circle';
}

export interface LogoElement extends ElementBase {
    type: 'logo';
    maxWidth: number;
    maxHeight: number;
}

export interface IconRowElement extends ElementBase {
    type: 'icon-row';
    iconSize: number;
    spacing: number;
    color: string;
}

export interface StarRatingElement extends ElementBase {
    type: 'star-rating';
    size: number;
    color: string;
    count: number;
}

export interface GroupElement extends ElementBase {
    type: 'group';
    children: DesignElement[];
    spacing?: number;
    direction?: 'horizontal' | 'vertical';
}

export type DesignElement =
    | TextElement
    | QRElement
    | LogoElement
    | DecorationElement
    | IconRowElement
    | StarRatingElement
    | GroupElement;

export interface DesignTemplate {
    id: string;
    name: string;
    description?: string;
    orientation: 'portrait' | 'square';
    dimensions: {
        width: number;
        height: number;
    };
    elements: DesignElement[];
    background?: string;
}

export interface DesignData {
    id?: string;
    userId?: string;
    gmbUrl: string;
    businessName: string;
    logoUrl?: string;
    phoneNumber?: string;
    websiteUrl?: string;
    emailAddress?: string;
    physicalAddress?: string;
    ctaText: string;
    hookText?: string;
    showStars: boolean;
    showSocials: boolean;
    primaryColor: string; // New
    secondaryColor: string; // New
    themeColor?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
}
