import { ComponentType } from "../interfaces";
import { PageSection, PageSectionProperties } from "./page";

export class MusicRecording {
  name: string = '';
  byArtist: string = '';
  duration: string = '';
  copyrightYear: number | undefined;
}

export class MusicPlaylist extends PageSection {
  track: MusicRecording[] = [];
}

export interface MusicRecordingComponent extends ComponentType<MusicRecording> {
  tag: 'li',
  properties: {
    name: 'h1',
    byArtist: 'span',
    duration: 'span',
    copyrightYear: 'span',
  }
}

export interface MusicPlaylistProperties extends PageSectionProperties {
  track: 'li',
}

export interface MusicPlaylistComponent extends ComponentType<MusicPlaylist> {
  tag: 'section',
  properties: MusicPlaylistProperties,
  refs: {
    tracks: 'ol',
  }
}
