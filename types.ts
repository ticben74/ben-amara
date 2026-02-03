
export enum InterventionType {
  BENCH = 'BENCH',
  MURAL = 'MURAL',
  PATH = 'PATH',
  DOOR = 'DOOR',
  GALLERY = 'GALLERY'
}

export type MediaType = 'video' | 'audio' | 'image' | 'multimodal';

export type TourTheme = 'heritage' | 'gastronomy' | 'art' | 'architecture';

export interface PathPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface ExternalAsset {
  id: string;
  label: string;
  url: string;
  provider: 'drive' | 'dropbox' | 'custom' | 'cloud';
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
  title?: string;
  pathPoints?: PathPoint[];
  themes?: TourTheme[];
  externalAssets?: ExternalAsset[];
  curatorNotes?: string;
}

export interface CuratedTour {
  id: string;
  name: string;
  description: string;
  stops: string[]; // IDs of interventions
  theme: TourTheme;
  isOfficial?: boolean;
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

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}
