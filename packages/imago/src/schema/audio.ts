import { ComponentType } from "../interfaces";

export class MusicRecording {
  name: string = '';
  byArtist: string = '';
  duration: string = '';
  copyrightYear: number | undefined;
}

export class MusicPlaylist {
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

export interface MusicPlaylistComponent extends ComponentType<MusicPlaylist> {
  tag: 'section',
  properties: {
    track: 'li',
  },
  slots: {
    tracks: 'ol',
  }
}
