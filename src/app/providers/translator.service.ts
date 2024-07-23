import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

import { throwError as observableThrowError } from 'rxjs';
import { catchError } from 'rxjs/operators';
// import 'rxjs/add/observable/throw';
// import 'rxjs/add/operator/catch';
import { Globals } from '../utils/globals';

import { LoggerService } from '../../chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from '../../chat21-core/providers/logger/loggerInstance';
import { AppConfigService } from './app-config.service';

@Injectable()
export class TranslatorService {

  private defaultLanguage = 'en'; // default language
  private language: string; // user language
  private logger: LoggerService = LoggerInstance.getInstance()

  translated_string: any;
  baseLocation: string;
  remoteTranslationsUrl: string;

  constructor(
    private _translate: TranslateService,
    public http: HttpClient,
    public g: Globals,
    public appConfigService: AppConfigService
  ) {

    let windowContext: Window = window;
    if (window.frameElement && window.frameElement.getAttribute('GPTMysite_context') === 'parent') {
      windowContext = window.parent;
    }

    if (windowContext['GPTMysite']) {
      this.baseLocation = windowContext['GPTMysite'].getBaseLocation();
      // console.log(`»»»» initI18n baseLocation`, this.baseLocation);
    }

    // this.initializeTransaltorService()

  }

  /**
   *
   * Return the browser language
   * used by humanWaitingTime in list-conversation
   *
   * @returns
   */
  public getLanguage() {
    return this.language;
    // return this._translate.getBrowserLang();
  }

  /** @unused method not used */
  initializeTransaltorService() {

    this._translate.setDefaultLang('it');
    const browserLang = this._translate.getBrowserLang();
    this.logger.debug('[TRANSLATOR-SERV] initializeTransaltorService--> DEVICE LANG ', browserLang);
    if (browserLang) {
          if (browserLang === 'it') {
              this._translate.use('it');
              this.http.get(this.baseLocation + `/assets/i18n/${browserLang}.json`).subscribe(data=> {
                this._translate.setTranslation('it', JSON.parse(data['_body']));
                this._translate.get('LABEL_PREVIEW').subscribe(res => {
                });
              })
              // this._translate.setTranslation('it', './assets/i18n/en.json')
          } else {
              this._translate.use('en');
              // this.http.get(this.baseLocation + `/assets/i18n/${browserLang}.json`).subscribe(data=> console.log('ress lang', data))
          }
      }

  }


  getTranslationFileUrl(browserLang) {
    this.remoteTranslationsUrl = environment.remoteTranslationsUrl;
    // console.log(`»»»» initI18n remoteTranslationsUrl`, this.remoteTranslationsUrl);
    const remoteTranslationsUrl = this.appConfigService.getConfig().remoteTranslationsUrl;
    if (remoteTranslationsUrl) {
      this.remoteTranslationsUrl = remoteTranslationsUrl;
    }
    // console.log(`»»»» initI18n remoteTranslationsUrl2`, this.appConfigService.getConfig());
    // console.log(`»»»» getTranslationFileUrl `, this.remoteTranslationsUrl);
    if (environment.loadRemoteTranslations) {
      return this.remoteTranslationsUrl + this.g.projectid + '/labels/' + browserLang.toUpperCase();
    } else {
      return this.baseLocation + `/assets/i18n/${browserLang}.json`;
    }
  }

  // https://github.com/ngx-translate/core/issues/282
  initI18n(): Promise<any> {
    this._translate.addLangs(['en', 'it']);
    this.logger.debug('[TRANSLATOR-SERV]»»»» initI18n getLangs ', this._translate.getLangs());

    // Set the default language for translation strings.
    const defaultLanguage = 'en';
    this.logger.debug('[TRANSLATOR-SERV] »»»» initI18n setDefaultLang ');
    this._translate.setDefaultLang(defaultLanguage);
    this.language = defaultLanguage;
    // Detect user language.
    let browserLang = this._translate.getBrowserLang();
    if (this.g.lang && this.g.lang !== '') {
      browserLang = this.g.lang;
      this.language = this.g.lang
    } else {
      this.g.lang = browserLang;
    }



    // const languageUrl = this.getTranslationFileUrl(browserLang);
    // console.log(`»»»» browserLang `, browserLang, this.g.lang, this.getTranslationFileUrl(browserLang));


    // Try to load the I18N JSON file for the detected language
    return new Promise((resolve, reject) => {
      const that = this;
      this.http.get(this.getTranslationFileUrl(browserLang))

      // .catch((error: any) => {
      //   // I18N File failed to load, fall back to default language
      //   // console.log(`»»»» initI18n !!! Problem with '${browserLang}' language initialization from URL `, error.url, ` - ERROR: `, error);
      //   this._translate.use(defaultLanguage);
      //   this.http.get(this.getTranslationFileUrl(defaultLanguage)).subscribe((data) => {
      //     this.translateWithBrowserLang(data['_body'], defaultLanguage);
      //   }, (er) => {
      //     // failed to load  default language from remote - fall back to local default language
      //     this.logger.error('[TRANSLATOR-SERV] »»»» initI18n Get default language - ERROR ', er);
      //     this.logger.error('[TRANSLATOR-SERV] »»»» initI18n - »»» loadRemoteTranslations IN ERROR ?', environment.loadRemoteTranslations);
      //   }, () => {
      //     resolve(true);
      //     // console.log('»»»» initI18n Get default language * COMPLETE *');
      //   });
      //   return Observable.throw(error);
      // })
      .pipe(
        catchError((error: any)=>{
            // I18N File failed to load, fall back to default language
            // console.log(`»»»» initI18n !!! Problem with '${browserLang}' language initialization from URL `, this.getTranslationFileUrl(browserLang), ` - ERROR: `, error);
            this._translate.use(defaultLanguage);
            this.http.get(this.getTranslationFileUrl(defaultLanguage)).subscribe((data) => {
              this.translateWithBrowserLang(data['data'], defaultLanguage);
            }, (er) => {
              // failed to load  default language from remote - fall back to local default language
              this.logger.error('[TRANSLATOR-SERV] »»»» initI18n Get default language - ERROR ', er);
              this.logger.error('[TRANSLATOR-SERV] »»»» initI18n - »»» loadRemoteTranslations IN ERROR ?', environment.loadRemoteTranslations);
            }, () => {
              resolve(true);
              // console.log('»»»» initI18n Get default language * COMPLETE *');
            });
            return observableThrowError(error);
        })
     )
     .subscribe((data: any) => {
        // I18N File loaded successfully, we can proceed
        // console.log(`»»»» Successfully initialized '${browserLang}' language.'`, data.data);
        this.logger.debug(`[TRANSLATOR-SERV] »»»» initI18n Successfully initialized '${browserLang}' language from URL'`, this.getTranslationFileUrl(browserLang));
        if (!data.data || data.data === undefined || data.data === '') {
          browserLang = defaultLanguage;
          this.language = defaultLanguage;
          this.g.lang = defaultLanguage;
          this._translate.use(defaultLanguage);
          // console.log('»»»» translateWithBrowserLang ', this.getTranslationFileUrl(defaultLanguage));
          this.http.get(this.getTranslationFileUrl(defaultLanguage)).subscribe((defaultdata) => {
            // console.log(`»»»» Successfully initialized  '${browserLang}' language.'`, defaultdata);
            this.translateWithBrowserLang(defaultdata['data'], browserLang);
          });
        } else {
          // console.log(`»»»» translateWithBrowserLang '${browserLang}' language.'`);
          this.language = data.lang.toLowerCase();;
          this.translateWithBrowserLang(data.data, this.language);
        }
      }, (error) => {
        this.logger.error(`[TRANSLATOR-SERV] »»»» initI18n Get '${browserLang}' language - ERROR `, error);
      }, () => {
        resolve(true);
        // console.log(`»»»» initI18n Get '${browserLang}' language - COMPLETE`);
      });

    });
  }


  private translateWithBrowserLang(data: any, lang: string) {
    this._translate.use(lang);
    this.logger.debug(`[TRANSLATOR-SERV] »»»» initI18n - »»» loadRemoteTranslations ?`, environment.loadRemoteTranslations);
    this._translate.setTranslation(lang, data, true);
    // if (environment.loadRemoteTranslations) {
    //   // console.log(`»»»» initI18n - »»» remote translation `, data);
    //   this._translate.setTranslation(lang, data, true);
    // } else {
    //   this._translate.setTranslation(lang, data, true);
    // }
  }

  /** */
  public translate(globals) {
    // set language

    // this.setLanguage(globals.windowContext, globals.lang);

    const labels: string[] = [
      'LABEL_PLACEHOLDER',
      'LABEL_START_NW_CONV',
      'LABEL_SELECT_TOPIC',
      'LABEL_COMPLETE_FORM',
      'LABEL_FIELD_NAME',
      'LABEL_ERROR_FIELD_NAME',
      'LABEL_FIELD_EMAIL',
      'LABEL_ERROR_FIELD_EMAIL',
      'LABEL_ERROR_FIELD_REQUIRED',
      'LABEL_WRITING',
      'LABEL_SEND_NEW_MESSAGE',
      'AGENT_NOT_AVAILABLE',
      'AGENT_AVAILABLE',
      'GUEST_LABEL',
      'ALL_AGENTS_OFFLINE_LABEL',
      'CALLOUT_TITLE_PLACEHOLDER',
      'CALLOUT_MSG_PLACEHOLDER',
      'ALERT_LEAVE_CHAT',
      'YES',
      'NO',
      'BUTTON_CLOSE_TO_ICON',
      'BUTTON_EDIT_PROFILE',
      'DOWNLOAD_TRANSCRIPT',
      'RATE_CHAT',
      'WELCOME',
      'WELCOME_TITLE',
      'WELCOME_MSG',
      'WELLCOME',
      'WELLCOME_TITLE',
      'WELLCOME_MSG',
      'OPTIONS',
      'SOUND_ON',
      'SOUND_OFF',
      'LOGOUT',
      'CUSTOMER_SATISFACTION',
      'YOUR_OPINION_ON_OUR_CUSTOMER_SERVICE',
      'YOUR_RATING',
      'WRITE_YOUR_OPINION',
      'SUBMIT',
      'THANK_YOU_FOR_YOUR_EVALUATION',
      'YOUR_RATING_HAS_BEEN_RECEIVED',
      'CLOSE',
      'PREV_CONVERSATIONS',
      'YOU',
      'SHOW_ALL_CONV',
      'START_A_CONVERSATION',
      'NO_CONVERSATION',
      'SEE_PREVIOUS',
      'WAITING_TIME_FOUND',
      'WAITING_TIME_NOT_FOUND',
      'CLOSED',
      'LABEL_PREVIEW'
    ];


    this._translate.get(labels).subscribe(res => {
      // console.log('»»»» initI18n »»»»»» »»»»»» GET TRANSLATED LABELS RES ', res);
      globals.LABEL_PLACEHOLDER = res['LABEL_PLACEHOLDER']
      globals.LABEL_START_NW_CONV = res['LABEL_START_NW_CONV'];
      globals.LABEL_SELECT_TOPIC = res['LABEL_SELECT_TOPIC'];
      globals.LABEL_COMPLETE_FORM = res['LABEL_COMPLETE_FORM'];
      globals.LABEL_FIELD_NAME = res['LABEL_FIELD_NAME'];
      globals.LABEL_ERROR_FIELD_NAME = res['LABEL_ERROR_FIELD_NAME'];
      globals.LABEL_FIELD_EMAIL = res['LABEL_FIELD_EMAIL'];
      globals.LABEL_ERROR_FIELD_EMAIL = res['LABEL_ERROR_FIELD_EMAIL'];
      globals.LABEL_WRITING = res['LABEL_WRITING'];
      globals.LABEL_SEND_NEW_MESSAGE = res['LABEL_SEND_NEW_MESSAGE'];
      globals.AGENT_NOT_AVAILABLE = res['AGENT_NOT_AVAILABLE']; // is used ??
      globals.AGENT_AVAILABLE = res['AGENT_AVAILABLE'];
      globals.GUEST_LABEL = res['GUEST_LABEL'];
      globals.ALL_AGENTS_OFFLINE_LABEL = res['ALL_AGENTS_OFFLINE_LABEL'];
      globals.CALLOUT_TITLE_PLACEHOLDER = res['CALLOUT_TITLE_PLACEHOLDER'];
      globals.CALLOUT_MSG_PLACEHOLDER = res['CALLOUT_MSG_PLACEHOLDER'];
      globals.ALERT_LEAVE_CHAT = res['ALERT_LEAVE_CHAT'];  // is used ??
      globals.YES = res['YES']; // is used ??
      globals.NO = res['NO']; // is used ??
      globals.BUTTON_CLOSE_TO_ICON = res['BUTTON_CLOSE_TO_ICON'];
      globals.BUTTON_EDIT_PROFILE = res['BUTTON_EDIT_PROFILE']; // is used ??
      globals.DOWNLOAD_TRANSCRIPT = res['DOWNLOAD_TRANSCRIPT'];
      globals.RATE_CHAT = res['RATE_CHAT']; // is used ??
      globals.WELCOME = res['WELLCOME'];
      globals.WELCOME_TITLE = res['WELLCOME_TITLE'];
      globals.WELCOME_MSG = res['WELLCOME_MSG'];
      globals.OPTIONS = res['OPTIONS'];
      globals.SOUND_ON = res['SOUND_ON'];
      globals.SOUND_OFF = res['SOUND_OFF'];
      globals.LOGOUT = res['LOGOUT'];
      globals.CUSTOMER_SATISFACTION = res['CUSTOMER_SATISFACTION'];
      globals.YOUR_OPINION_ON_OUR_CUSTOMER_SERVICE = res['YOUR_OPINION_ON_OUR_CUSTOMER_SERVICE'];
      globals.YOUR_RATING = res['YOUR_RATING']; // is used ??
      globals.WRITE_YOUR_OPINION = res['WRITE_YOUR_OPINION'];
      globals.SUBMIT = res['SUBMIT']; // se nn si carica la traduzione nn viene visualizzato il testo e si riname bloccati
      globals.THANK_YOU_FOR_YOUR_EVALUATION = res['THANK_YOU_FOR_YOUR_EVALUATION'];
      globals.YOUR_RATING_HAS_BEEN_RECEIVED = res['YOUR_RATING_HAS_BEEN_RECEIVED'];
      globals.CLOSE = res['CLOSE']; // se nn si carica la traduzione nn viene visualizzato il testo e si riname bloccati
      globals.PREV_CONVERSATIONS = res['PREV_CONVERSATIONS'];
      globals.YOU = res['YOU'];
      globals.SHOW_ALL_CONV = res['SHOW_ALL_CONV'];
      globals.START_A_CONVERSATION = res['START_A_CONVERSATION']; // is used ??
      globals.NO_CONVERSATION = res['NO_CONVERSATION'];
      globals.SEE_PREVIOUS = res['SEE_PREVIOUS']; // is used ??
      globals.WAITING_TIME_FOUND = res['WAITING_TIME_FOUND'];
      globals.WAITING_TIME_NOT_FOUND = res['WAITING_TIME_NOT_FOUND'];
      globals.CLOSED = res['CLOSED'];
      globals.LABEL_PREVIEW = res['LABEL_PREVIEW']
      globals.LABEL_ERROR_FIELD_REQUIRED= res['LABEL_ERROR_FIELD_REQUIRED']


      if(globals.WELCOME_TITLE === 'WELLCOME_TITLE') globals.WELCOME_TITLE = res['WELCOME_TITLE']
      if (!globals.welcomeTitle) {
        globals.welcomeTitle = globals.WELCOME_TITLE;   /** Set the widget welcome message. Value type : string */
      }

      if(globals.WELCOME_MSG === 'WELLCOME_MSG') globals.WELCOME_MSG = res['WELCOME_MSG']
      if (!globals.welcomeMsg) {
        globals.welcomeMsg = globals.WELCOME_MSG;       /** Set the widget welcome message. Value type : string */
      }

    }, (error) => {
      this.logger.error('[TRANSLATOR-SERV]»»»»»» »»»»»» GET TRANSLATED LABELS - ERROR ', error);
    }, () => {
      // console.log('»»»»»» »»»»»» GET TRANSLATED LABELS * COMPLETE *');
    });



    // globals.setParameter('lang', this.language);

    // translate

    // console.log('»»»»» globals', globals)
    // globals.LABEL_PLACEHOLDER = this.translateForKey('LABEL_PLACEHOLDER') // done
    // globals.LABEL_START_NW_CONV = this.translateForKey('LABEL_START_NW_CONV'); // done
    // globals.LABEL_SELECT_TOPIC = this.translateForKey('LABEL_SELECT_TOPIC'); // done
    // globals.LABEL_COMPLETE_FORM = this.translateForKey('LABEL_COMPLETE_FORM'); // done
    // globals.LABEL_FIELD_NAME = this.translateForKey('LABEL_FIELD_NAME'); // done
    // globals.LABEL_ERROR_FIELD_NAME = this.translateForKey('LABEL_ERROR_FIELD_NAME'); // done
    // globals.LABEL_FIELD_EMAIL = this.translateForKey('LABEL_FIELD_EMAIL'); // done
    // globals.LABEL_ERROR_FIELD_EMAIL = this.translateForKey('LABEL_ERROR_FIELD_EMAIL'); // done
    // globals.LABEL_WRITING = this.translateForKey('LABEL_WRITING'); // done
    // globals.AGENT_NOT_AVAILABLE = this.translateForKey('AGENT_NOT_AVAILABLE'); // done
    // globals.AGENT_AVAILABLE = this.translateForKey('AGENT_AVAILABLE'); // done
    // globals.GUEST_LABEL = this.translateForKey('GUEST_LABEL'); // done
    // globals.ALL_AGENTS_OFFLINE_LABEL = this.translateForKey('ALL_AGENTS_OFFLINE_LABEL'); // done
    // globals.CALLOUT_TITLE_PLACEHOLDER = this.translateForKey('CALLOUT_TITLE_PLACEHOLDER'); // done
    // globals.CALLOUT_MSG_PLACEHOLDER = this.translateForKey('CALLOUT_MSG_PLACEHOLDER');  // done
    // globals.ALERT_LEAVE_CHAT = this.translateForKey('ALERT_LEAVE_CHAT'); // done
    // globals.YES = this.translateForKey('YES');  // done
    // globals.NO = this.translateForKey('NO'); // done
    // globals.BUTTON_CLOSE_TO_ICON = this.translateForKey('BUTTON_CLOSE_TO_ICON');  // done
    // globals.BUTTON_EDIT_PROFILE = this.translateForKey('BUTTON_EDIT_PROFILE');   // done
    // globals.DOWNLOAD_TRANSCRIPT = this.translateForKey('DOWNLOAD_TRANSCRIPT'); // done
    // globals.RATE_CHAT = this.translateForKey('RATE_CHAT'); // done
    // globals.WELLCOME_TITLE = this.translateForKey('WELLCOME_TITLE');  // done
    // globals.WELLCOME_MSG = this.translateForKey('WELLCOME_MSG'); // done
    // globals.OPTIONS = this.translateForKey('OPTIONS'); // done
    // globals.SOUND_ON = this.translateForKey('SOUND_ON'); // done
    // globals.SOUND_OFF = this.translateForKey('SOUND_OFF'); // done
    // globals.LOGOUT = this.translateForKey('LOGOUT'); // done
    // globals.CUSTOMER_SATISFACTION = this.translateForKey('CUSTOMER_SATISFACTION'); // done
    // globals.YOUR_OPINION_ON_OUR_CUSTOMER_SERVICE = this.translateForKey('YOUR_OPINION_ON_OUR_CUSTOMER_SERVICE'); // done
    // globals.DOWNLOAD_TRANSCRIPT = this.translateForKey('DOWNLOAD_TRANSCRIPT'); // done
    // globals.YOUR_RATING = this.translateForKey('YOUR_RATING'); // done
    // globals.WRITE_YOUR_OPINION = this.translateForKey('WRITE_YOUR_OPINION'); // done
    // globals.SUBMIT = this.translateForKey('SUBMIT'); // done
    // globals.THANK_YOU_FOR_YOUR_EVALUATION = this.translateForKey('THANK_YOU_FOR_YOUR_EVALUATION'); // done
    // globals.YOUR_RATING_HAS_BEEN_RECEIVED = this.translateForKey('YOUR_RATING_HAS_BEEN_RECEIVED'); // done
    // globals.CLOSE = this.translateForKey('CLOSE'); // done
    // globals.PREV_CONVERSATIONS = this.translateForKey('PREV_CONVERSATIONS'); // done
    // globals.YOU = this.translateForKey('YOU'); // done
    // globals.SHOW_ALL_CONV = this.translateForKey('SHOW_ALL_CONV'); // done
    // globals.START_A_CONVERSATION = this.translateForKey('START_A_CONVERSATION'); // done
    // globals.NO_CONVERSATION = this.translateForKey('NO_CONVERSATION'); // done
    // globals.SEE_PREVIOUS = this.translateForKey('SEE_PREVIOUS'); // done
    // globals.WAITING_TIME_FOUND = this.translateForKey('WAITING_TIME_FOUND'); // done
    // globals.WAITING_TIME_NOT_FOUND = this.translateForKey('WAITING_TIME_NOT_FOUND'); // done
    // globals.CLOSED = this.translateForKey('CLOSED');

    // if (!globals.wellcomeTitle) {
    //   globals.wellcomeTitle = globals.WELLCOME_TITLE;   /** Set the widget welcome message. Value type : string */
    // }
    // if (!globals.wellcomeMsg) {
    //   globals.wellcomeMsg = globals.WELLCOME_MSG;       /** Set the widget welcome message. Value type : string */
    // }


  }


  /**
  * Return the browser language if it is detected, an epty string otherwise
  * @returns the browser language
  */
  // public getBrowserLanguage(windowContext) {
  //   // console.log('windowContext', windowContext);
  //   const browserLanguage = windowContext.navigator.language;
  //   return !browserLanguage ? undefined : browserLanguage;
  // }

  /**
   * Set the language in which to translate.
   * If it is provided a not valid language it will use the default language (en)
   * @param language the language
   */
  // public setLanguage(windowContext, language) {
  //   // console.log('windowContext-language', windowContext, language);
  //   // set the user languge if it is valid.
  //   // if the user language is not valid, try to get the browser language.
  //   // if the browser language is not valid, it use the default language (en)
  //   if (!language) {
  //     // user language not valid
  //     if (this.getBrowserLanguage(windowContext) !== undefined) {
  //       // browser language valid
  //       this.language = this.getBrowserLanguage(windowContext);
  //     } else {
  //       // browser language not valid
  //       this.language = this.defaultLanguage;
  //     }
  //   } else {
  //     // user language valid
  //     this.language = language;
  //   }
  //   this.language = this.language.substring(0, 2);
  //   // retrieve the translation
  //   // console.log('LINGUA IMPOSTATA: ', this.language);
  //   this.getLanguageObject(this.language);
  // }

  // retrieve the language object
  // private getLanguageObject(language) {
  //   if (language === 'en') {
  //     this.translations = translations.en;
  //   } else if (language === 'it') {
  //     this.translations = translations.it;
  //   } else {
  //     // use the default language in any other case
  //     this.translations = translations.en;
  //   }
  // }

  /**
   * Translate a keyword to the language set with the method setLanguage(language)
   * @param keyword the keyword to translate
   * @returns the keyword translations
   */
  // public translateForKey(keyword: string): string {
  //   // console.log('this.translations -> keyword: ', this.translations[keyword]);
  //   return !this.translations[keyword] ? '' : this.translations[keyword];
  // }



  // public getDefaultLanguage() {
  //   return this.defaultLanguage;
  // }
}
