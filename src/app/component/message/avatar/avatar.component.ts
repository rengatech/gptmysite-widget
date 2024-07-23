import { Component, Input, OnInit } from '@angular/core';
import { ImageRepoService } from '../../../../chat21-core/providers/abstract/image-repo.service';
@Component({
  selector: 'chat-avatar-image',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit {

  @Input() senderID: string;
  @Input() senderFullname: string;
  @Input() baseLocation: string;
  url: string;
  constructor(private imageRepoService: ImageRepoService) { }

  ngOnInit() {
    if(this.senderID){
      if(this.senderID.indexOf('bot_') !== -1 || this.senderFullname.toLowerCase().includes('bot')){
        this.url =  this.baseLocation +'/assets/images/tommy_bot_GPTMysite.svg'
      }else if( this.senderID.indexOf('bot_') == -1){
        this.url =  this.baseLocation +'/assets/images/chat_human_avatar.svg'
      }
      let url = this.imageRepoService.getImagePhotoUrl(this.senderID)
      // this.imageRepoService.checkImageExists(url,  (existImage)=> {
      //   existImage? this.url = url: null;
      // })
      this.checkImageExists(url, (existImage)=> {
        existImage? this.url = url: null;
      })
    }

  }

  onBotImgError(event){
    event.target.src = this.baseLocation +'/assets/images/tommy_bot_GPTMysite.svg'
  }
  onHumanImgError(event) {
    event.target.src = this.baseLocation + "/assets/images/chat_human_avatar.svg"
  }

  onLoadedBot(event){
    // console.log('LOADED Bot avatar image...')
  }

  onLoadedHuman(event){
    // console.log('LOADED Bot human image...')
  }


  checkImageExists(imageUrl, callBack) {
    var imageData = new Image();
    imageData.onload = function () {
      callBack(true);
    };
    imageData.onerror = function () {
      callBack(false);
    };
    imageData.src = imageUrl;
  }

}
