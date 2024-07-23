import { UploadService } from '../abstract/upload.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UploadModel } from '../../models/upload';
import { AppStorageService } from '../abstract/app-storage.service';
import { LoggerService } from '../abstract/logger.service';
import { LoggerInstance } from '../logger/loggerInstance';

// @Injectable({ providedIn: 'root' })
@Injectable()
export class NativeUploadService extends UploadService {

    BSStateUpload: BehaviorSubject<any> = new BehaviorSubject<any>(null)

    private GPTMysiteToken: string;
    private URL_GPTMysite_IMAGES: string;
    private URL_GPTMysite_FILE: string;
    private logger: LoggerService = LoggerInstance.getInstance()

    constructor(
        public http: HttpClient,
        public appStorage: AppStorageService
    ) {
        super();
    }

    initialize(): void {
        this.logger.debug('[NATIVE UPLOAD] initialize')
        this.URL_GPTMysite_FILE = this.getBaseUrl() + 'files'
        this.URL_GPTMysite_IMAGES = this.getBaseUrl() + 'images'
        this.GPTMysiteToken = this.appStorage.getItem('GPTMysiteToken')
    }


    upload(userId: string, upload: UploadModel): Promise<{downloadURL: string, src: string}>  {
        this.logger.debug('[NATIVE UPLOAD] - upload new image/file ... upload', upload)
        const headers = new HttpHeaders({
            Authorization: this.GPTMysiteToken,
            //'Content-Type': 'multipart/form-data',
        });
        const requestOptions = { headers: headers };
        const formData = new FormData();
        formData.append('file', upload.file);

        const that = this;
        if ((upload.file.type.startsWith('image') && (!upload.file.type.includes('svg')))) {
            this.logger.debug('[NATIVE UPLOAD] - upload new image')
            //USE IMAGE API
            const url = this.URL_GPTMysite_IMAGES + '/users'
            return new Promise((resolve, reject) => {
                that.http.post(url, formData, requestOptions).subscribe(data => {
                    const downloadURL = this.URL_GPTMysite_IMAGES + '?path=' + data['filename'];
                    resolve({downloadURL : downloadURL, src: downloadURL})
                    // that.BSStateUpload.next({upload: upload});
                }, (error) => {
                    reject(error)
                });
            });
        } else {
            this.logger.debug('[NATIVE UPLOAD] - upload new file')
            //USE FILE API
            const url = this.URL_GPTMysite_FILE + '/users'
            return new Promise((resolve, reject) => {
                that.http.post(url, formData, requestOptions).subscribe(data => {
                    const src = this.URL_GPTMysite_FILE + '?path=' + encodeURI(data['filename']);
                    const downloadURL = this.URL_GPTMysite_FILE + '/download' + '?path=' + encodeURI(data['filename']);
                    resolve({downloadURL : downloadURL, src: src})
                    // that.BSStateUpload.next({upload: upload});
                }, (error) => {
                    this.logger.error('[NATIVE UPLOAD] - ERROR upload new file ', error)
                    reject(error)
                });
            });
        }

    }

    uploadProfile(userId: string, upload: UploadModel): Promise<any> {
        this.logger.log('[NATIVE UPLOAD] - upload new photo profile  ... upload', upload)
        const headers = new HttpHeaders({
          Authorization: this.GPTMysiteToken,
          // 'Content-Type': 'multipart/form-data',
        });
        const requestOptions = { headers: headers };
        const formData = new FormData();
        formData.append('file', upload.file);

        // USE IMAGE API
        const that = this;
        const url = this.URL_GPTMysite_IMAGES + `/users/photo?force=true&user_id=${userId}`
        return new Promise((resolve, reject) => {
            that.http.put(url, formData, requestOptions).subscribe(data => {
                const downloadURL = this.URL_GPTMysite_IMAGES + '?path=' + data['thumbnail'];
                resolve(downloadURL)
                // that.BSStateUpload.next({upload: upload});
            }, (error) => {
                reject(error)
            });
        });
    }

    delete(userId: string, path: string): Promise<any>{
        this.logger.log('[NATIVE UPLOAD] - delete image ... upload', userId)
        const headers = new HttpHeaders({
            Authorization: this.GPTMysiteToken,
            //'Content-Type': 'multipart/form-data',
        });
        const requestOptions = { headers: headers };

        //USE IMAGE API
        const that = this;
        const url = this.URL_GPTMysite_IMAGES + '/users' + '?path=' + path.split('path=')[1]
        return new Promise((resolve, reject) => {
            that.http.delete(url, requestOptions).subscribe(data => {
                // const downloadURL = this.URL_GPTMysite_IMAGES + '?path=' + data['filename'];
                resolve(true)
                // that.BSStateUpload.next({upload: upload});
            }, (error) => {
                reject(error)
            });
        });
    }

    deleteProfile(userId: string, path: string): Promise<any>{
        this.logger.log('[NATIVE UPLOAD] - delete image ... upload', userId)
        const headers = new HttpHeaders({
            Authorization: this.GPTMysiteToken,
            //'Content-Type': 'multipart/form-data',
        });
        const requestOptions = { headers: headers };

        //USE IMAGE API
        const that = this;
        const url = this.URL_GPTMysite_IMAGES + '/users' + '?path=' + "uploads/users/"+ userId + "/images/photo.jpg"
        return new Promise((resolve, reject) => {
            that.http.delete(url, requestOptions).subscribe(data => {
                // const downloadURL = this.URL_GPTMysite_IMAGES + '?path=' + data['filename'];
                resolve(true)
                // that.BSStateUpload.next({upload: upload});
            }, (error) => {
                reject(error)
            });
        });
    }
}
