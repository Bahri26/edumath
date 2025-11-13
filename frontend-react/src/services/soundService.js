// frontend-react/src/services/soundService.js

class SoundService {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    
    // Load sound effects from CDN (free sounds)
    this.soundUrls = {
      correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Success
      wrong: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Error
      levelUp: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Level up
      xpGain: 'https://assets.mixkit.co/active_storage/sfx/1434/1434-preview.mp3', // Coin
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Click
      unlock: 'https://assets.mixkit.co/active_storage/sfx/1453/1453-preview.mp3', // Unlock
      heartLoss: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // Heart loss
    };
    
    this.preloadSounds();
  }

  preloadSounds() {
    Object.keys(this.soundUrls).forEach(key => {
      try {
        const audio = new Audio(this.soundUrls[key]);
        audio.volume = this.volume;
        audio.preload = 'auto';
        this.sounds[key] = audio;
      } catch (error) {
        console.warn(`Failed to preload sound: ${key}`, error);
      }
    });
  }

  play(soundName) {
    if (!this.enabled) return;
    
    try {
      const sound = this.sounds[soundName];
      if (sound) {
        // Clone audio for overlapping sounds
        const audioClone = sound.cloneNode();
        audioClone.volume = this.volume;
        audioClone.play().catch(err => {
          console.warn(`Failed to play sound: ${soundName}`, err);
        });
      }
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Singleton instance
const soundService = new SoundService();

export default soundService;
