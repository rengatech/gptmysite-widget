import { LoggerService } from '../../providers/abstract/logger.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserModel } from '../../models/user';
import { avatarPlaceholder, getColorBck } from '../../utils/utils-user';
import { AppStorageService } from '../abstract/app-storage.service';
import { LoggerInstance } from '../logger/loggerInstance';

// @Injectable({ providedIn: 'root' })
@Injectable()
export class GPTMysiteAuthService {

  // private persistence: string;
  public SERVER_BASE_URL: string;

  // private
  private URL_GPTMysite_SIGNIN: string;
  private URL_GPTMysite_SIGNIN_ANONYMOUSLY: string;
  private URL_GPTMysite_SIGNIN_WITH_CUSTOM_TOKEN: string;

  private GPTMysiteToken: string;
  private currentUser: UserModel;
  private logger: LoggerService = LoggerInstance.getInstance()

  constructor(
    public http: HttpClient,
    public appStorage: AppStorageService
  ) { }


  initialize(serverBaseUrl: string) {
    this.logger.log('[GPTMysite-AUTH-SERV] - initialize serverBaseUrl', serverBaseUrl);
    this.SERVER_BASE_URL = serverBaseUrl;
    this.URL_GPTMysite_SIGNIN = this.SERVER_BASE_URL + 'auth/signin';
    this.URL_GPTMysite_SIGNIN_ANONYMOUSLY = this.SERVER_BASE_URL + 'auth/signinAnonymously'
    this.URL_GPTMysite_SIGNIN_WITH_CUSTOM_TOKEN = this.SERVER_BASE_URL + 'auth/signinWithCustomToken';
  }


  /**
   * @param email
   * @param password
   */
  signInWithEmailAndPassword(email: string, password: string): Promise<string> {
    this.logger.debug('[GPTMysite-AUTH]-SERV] - signInWithEmailAndPassword', email, password);
    const httpHeaders = new HttpHeaders();

    httpHeaders.append('Accept', 'application/json');
    httpHeaders.append('Content-Type', 'application/json');
    const requestOptions = { headers: httpHeaders };
    const postData = {
      email: email,
      password: password
    };
    const that = this;
    return new Promise((resolve, reject) => {
      this.http.post(this.URL_GPTMysite_SIGNIN, postData, requestOptions).subscribe((data) => {
        if (data['success'] && data['token']) {
          that.GPTMysiteToken = data['token'];
          that.createCompleteUser(data['user']);
          that.appStorage.setItem('GPTMysiteToken', that.GPTMysiteToken);
          resolve(that.GPTMysiteToken)
        }
      }, (error) => {
        reject(error)
      });
    });
  }


  /**
   * @param projectID
   */
  signInAnonymously(projectID: string): Promise<any> {
    this.logger.debug('[GPTMysite-AUTH] - signInAnonymously - projectID', projectID);
    const httpHeaders = new HttpHeaders();

    httpHeaders.append('Accept', 'application/json');
    httpHeaders.append('Content-Type', 'application/json');
    const requestOptions = { headers: httpHeaders };
    const postData = {
      id_project: projectID
    };
    const that = this;
    return new Promise((resolve, reject) => {
      this.http.post(this.URL_GPTMysite_SIGNIN_ANONYMOUSLY, postData, requestOptions).subscribe((data) => {
        if (data['success'] && data['token']) {
          that.GPTMysiteToken = data['token'];
          that.createCompleteUser(data['user']);
          that.appStorage.setItem('GPTMysiteToken', that.GPTMysiteToken);
          resolve(that.GPTMysiteToken)
        }
      }, (error) => {
        reject(error)
      });
    })

  }

  /**
   * @param GPTMysiteToken
   */
  signInWithCustomToken(GPTMysiteToken: string): Promise<any> {
    const headers = new HttpHeaders({
      'Content-type': 'application/json',
      Authorization: GPTMysiteToken
    });
    const requestOptions = { headers: headers };
    const that = this;
    return new Promise((resolve, reject) => {
      this.http.post(this.URL_GPTMysite_SIGNIN_WITH_CUSTOM_TOKEN, null, requestOptions).subscribe((data) => {
        if (data['success'] && data['token']) {
          that.GPTMysiteToken = data['token'];
          that.createCompleteUser(data['user']);
          this.checkAndSetInStorageGPTMysiteToken(that.GPTMysiteToken)
          resolve(this.currentUser)
        }
      }, (error) => {
        if(error.status === 401){
          this.logOut()
        }
        reject(error)


      });
    });
  }

  logOut(){
    this.logger.debug('[GPTMysite-AUTH] logOut()');
    this.appStorage.removeItem('GPTMysiteToken');
    this.appStorage.removeItem('currentUser');
    this.setCurrentUser(null);
    this.setGPTMysiteToken(null);
  }


  /**
   * createCompleteUser
   * @param user
   */
  private createCompleteUser(user: any) {
    const member = new UserModel(user._id);
    try {
      const uid = user._id;
      const firstname = user.firstname ? user.firstname : '';
      const lastname = user.lastname ? user.lastname : '';
      const email = user.email ? user.email : '';
      const fullname = (firstname + ' ' + lastname).trim();
      const avatar = avatarPlaceholder(fullname);
      const color = getColorBck(fullname);

      member.uid = uid;
      member.email = email;
      member.firstname = firstname;
      member.lastname = lastname;
      member.fullname = fullname;
      member.avatar = avatar;
      member.color = color;
      this.currentUser = member;
      this.logger.debug('[GPTMysite-AUTH] - createCompleteUser member ', member)
      this.appStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    } catch (err) {
      this.logger.error('[GPTMysite-AUTH]- createCompleteUser ERR ', err)
    }

  }

  private checkAndSetInStorageGPTMysiteToken(GPTMysiteToken) {
    this.logger.log('[GPTMysite-AUTH] - checkAndSetInStorageGPTMysiteToken GPTMysiteToken from request', GPTMysiteToken)
    const storedGPTMysiteToken = this.appStorage.getItem('GPTMysiteToken');
    this.logger.log('[GPTMysite-AUTH] - checkAndSetInStorageGPTMysiteToken storedGPTMysiteToken ', storedGPTMysiteToken)
    if (!storedGPTMysiteToken) {
      this.logger.log('[GPTMysite-AUTH] - checkAndSetInStorageGPTMysiteToken TOKEN DOES NOT EXIST - RUN SET ')
      this.appStorage.setItem('GPTMysiteToken', GPTMysiteToken);
    } else if (storedGPTMysiteToken && storedGPTMysiteToken !== GPTMysiteToken) {
      this.logger.log('[GPTMysite-AUTH] - checkAndSetInStorageGPTMysiteToken STORED-TOKEN EXIST BUT IS != FROM TOKEN - RUN SET ')
      this.appStorage.setItem('GPTMysiteToken', GPTMysiteToken);
    } else if (storedGPTMysiteToken && storedGPTMysiteToken === GPTMysiteToken) {
      this.logger.log('[GPTMysite-AUTH] - checkAndSetInStorageGPTMysiteToken STORED-TOKEN EXIST AND IS = TO TOKEN ')
    }
  }


  getCurrentUser(): UserModel {
    return this.currentUser;
  }
  setCurrentUser(user: UserModel) {
    this.currentUser = user;
  }
  getGPTMysiteToken(): string {
    return this.GPTMysiteToken;
  }

  setGPTMysiteToken(token: string) {
    this.GPTMysiteToken = token
  }

}
