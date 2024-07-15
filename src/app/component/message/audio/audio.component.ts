import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
// import lottieWeb from 'https://cdn.skypack.dev/lottie-web';

@Component({
  selector: 'chat-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.scss']
})
export class AudioComponent implements OnInit {

  @Input() metadata: any;
  @Output() onElementRendered = new EventEmitter<{element: string, status: boolean}>();

  uidAudioPlayng: string = ''
  divPlay: HTMLAudioElement
  playState: HTMLElement
  status: 'play' | 'pause' = 'play'

  constructor(private elementRef: ElementRef) { }

  ngOnInit() {
    // this.divPlay = this.elementRef.nativeElement.querySelector('#audio_container').querySelector('#audio_msg')
    // this.playState= this.elementRef.nativeElement.querySelector('#audio_container').querySelector('#duration')
  }

  onPlayPause(status: string){
    // const divPlay = (<HTMLAudioElement>document.getElementById('audio_msg'));
    if(status === 'play') {
      this.divPlay.play();
      this.status = 'pause'
    } else {
      this.divPlay.pause();
      this.status = 'play'
    }
  }
  
  pauseAudioMsg(e) {
    try {
      // stop all audio
      if (this.uidAudioPlayng) {
        const divPlay = (<HTMLAudioElement>document.getElementById(this.uidAudioPlayng));
        divPlay.pause();
        // console.log('> pausa: ', divPlay);
      }
    } catch (error) {
      console.log('> Error is: ', error);
    }

    try {
      // console.log(e.target.id);
      if (this.uidAudioPlayng) {
        this.uidAudioPlayng = '';
      }
    } catch (error) {
      console.log('> Error is: ', error);
    }
  }

  playAudioMsg(e) {
    // stop all audio
    if (this.uidAudioPlayng) {
      const divPlay = (<HTMLAudioElement>document.getElementById(this.uidAudioPlayng));
      divPlay.pause();
      // console.log('> pausa: ', divPlay);
    }
    try {
      // console.log(e.target.id);
      // set uid audio playng
      this.uidAudioPlayng = e.target.id;
    } catch (error) {
      console.log('> Error is: ', error);
    }
  }

  updateTimeAudioMsg(ev){
    var currTime = Math.floor(ev.target.currentTime); 
    var duration = Math.floor(ev.target.duration);

    let minutes = 0;
    if(currTime > 60){
      minutes = Math.floor(currTime / 60);
    }
    const seconds = currTime - minutes * 60
    // console.log('timeeee', minutes + ':' + seconds )
    // this.playState.innerHTML = minutes + ':' + seconds
  }



  /**
   *
   * @param uid
   */
  playPausaAudioMsg(uid: string) {
    // console.log('playPausaAudioMsg: ', uid);
    const that = this;
    try {
      const divPause = (<HTMLAudioElement>document.getElementById(that.uidAudioPlayng));
      const divPlay = (<HTMLAudioElement>document.getElementById(uid));
      if (divPause) {
        divPause.pause();
      }

      if (that.uidAudioPlayng === uid) {
        that.uidAudioPlayng = '';
      } else {
        if (divPlay) {
          setTimeout(function() {
            // if (that.g.autoplay_activated) {
            //   divPlay.play();
            // }
            this.uidAudioPlayng = uid;
          }, 300);
        }
      }

    } catch (error) {
      console.log('> Error is: ', error);
    }
  }

}
