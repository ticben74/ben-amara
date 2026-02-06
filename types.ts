
export enum InterventionType {
  BENCH = 'BENCH',
  MURAL = 'MURAL',
  PATH = 'PATH',
  DOOR = 'DOOR',
  GALLERY = 'GALLERY'
}

export type MediaType = 'video' | 'audio' | 'image' | 'multimodal';
export type TourTheme = 'heritage' | 'gastronomy' | 'art' | 'architecture' | 'custom';
export type AuthorType = 'artist' | 'ai' | 'hybrid';

// --- Advanced Template System Types ---

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'image' | 'audio' | 'location' | 'select';
  options?: string[];
  default?: any;
  required: boolean;
}

export interface TemplateComponent {
  id: string;
  name: string;
  type: 'audio_narration' | 'visual_art' | 'interactive_quiz' | 'place_info';
  interventionType: InterventionType;
  config: any;
  conditions?: string[];
}

export interface TemplateLogic {
  trigger: 'on_start' | 'on_component_complete' | 'on_tour_finish';
  action: 'unlock_next' | 'generate_visual' | 'send_notification' | 'award_badge';
  params: any;
}

export interface DynamicTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'education' | 'tourism' | 'art_curation';
  components: TemplateComponent[];
  variables: TemplateVariable[];
  logic: TemplateLogic[];
}

// --- Existing Types ---

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
  
  // Collaborative Fields
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
