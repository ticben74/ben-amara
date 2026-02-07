
export enum InterventionType {
  BENCH = 'BENCH',
  MURAL = 'MURAL',
  PATH = 'PATH',
  DOOR = 'DOOR',
  GALLERY = 'GALLERY',
  MARKET = 'MARKET'
}

export type MediaType = 'video' | 'audio' | 'image' | 'multimodal';
export type TourTheme = 'heritage' | 'gastronomy' | 'art' | 'architecture' | 'custom';
export type AuthorType = 'artist' | 'ai' | 'hybrid';

// --- Widget System Types ---
export type WidgetType = 'map' | 'competition' | 'discovery' | 'furnishing' | 'surprise' | 'links';

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
}

export interface TourUIConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: 'Cairo' | 'Amiri';
  backgroundImage?: string;
  introGifUrl?: string;
  buttonShape?: 'rounded' | 'pill' | 'sharp';
  glassEffect?: boolean;
  cardStyle?: 'minimal' | 'flat' | 'elevated';
  welcomeMessage?: string;
  viewMode: 'map' | 'gallery' | 'story';
  enabledWidgets?: WidgetType[];
  customLinks?: CustomLink[]; // الروابط المخصصة الجديدة
}

export interface CuratedTour {
  id: string;
  name: string;
  description: string;
  stops: string[];
  theme: TourTheme;
  isOfficial?: boolean;
  city?: string;
  ui_config?: TourUIConfig;
  curator_name?: string;
}

export interface InterventionItem {
  id: string;
  type: InterventionType;
  mediaType: MediaType;
  location: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'maintenance' | 'planned';
  lastUpdated: string;
  interactCount: number;
  mediaUrl?: string;
  audioUrl?: string;
  pathPoints?: { id: string; name: string; latitude: number; longitude: number; order: number }[];
  authorType: AuthorType;
  artistName?: string;
  curatorNote?: string;
  rawArtistNotes?: string;
}

export interface ArtPiece {
  id: string;
  title: string;
  artistName: string;
  imageUrl: string;
  artistWord: string;
  exhibitionText: string;
  dimensions: string;
  year: string;
}

export interface StopInteraction {
  question: string;
  options: string[];
  correctAnswer: string;
  fact: string;
}

export interface ExperiencePackage {
  id: string;
  name: string;
  description: string;
  creator: string;
  downloads: number;
  rating: number;
  interventions: InterventionItem[];
  tours: CuratedTour[];
  thumbnail: string;
  category: 'heritage' | 'art' | 'gastronomy' | 'education';
  tags: string[];
  isOfficial: boolean;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'number';
  options?: string[];
  required?: boolean;
  default?: any;
}

export interface TemplateComponent {
  id: string;
  name: string;
  type: string;
  interventionType: InterventionType;
  config: Record<string, any>;
  conditions?: string[];
}

export interface TemplateLogic {
  trigger: string;
  action: string;
  params: Record<string, any>;
}

export interface DynamicTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  variables: TemplateVariable[];
  components: TemplateComponent[];
  logic: TemplateLogic[];
}
