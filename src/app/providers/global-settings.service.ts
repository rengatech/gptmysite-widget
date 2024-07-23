import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// services
import { Globals } from '../utils/globals';
import { convertColorToRGBA, detectIfIsMobile, getImageUrlThumb, getParameterByName, stringToBoolean, stringToNumber } from '../utils/utils';

import { TemplateBindingParseResult } from '@angular/compiler';
import { AppStorageService } from '../../chat21-core/providers/abstract/app-storage.service';
import { LoggerService } from '../../chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from '../../chat21-core/providers/logger/loggerInstance';
import { invertColor, isJsonArray } from '../../chat21-core/utils/utils';
import { AppConfigService } from './app-config.service';


@Injectable()
export class GlobalSettingsService {
    globals: Globals;
    el: ElementRef;
    obsSettingsService: BehaviorSubject<boolean>;
    private logger: LoggerService = LoggerInstance.getInstance()

    constructor(
        public http: HttpClient,
        private appStorageService: AppStorageService,
        // private settingsService: SettingsService,
        public appConfigService: AppConfigService
    ) {
        this.obsSettingsService = new BehaviorSubject<boolean>(null);
    }

    /**
     * load paramiters
     * 0 - imposto globals con i valori di default
     * 1 - imposto il projectId
     * 2 - recupero i parametri principali dal settings: projectid, persistence, userToken, userId, filterByRequester
     * 3 - recupero i parametri dal server
     * 4 - attendo la risposta del server e richiamo setParameters per il settaggio dei parametri
     */
    initWidgetParamiters(globals: Globals, el: ElementRef) {
        const that = this;
        this.globals = globals;
        this.el = el;
        // ------------------------------- //
        /**
        * SETTING LOCAL DEFAULT:
        * set the default globals parameters
        */
        this.globals.initDefafultParameters();

        /** SET PROJECT ID */
        let projectid: string;
        try {
            projectid = this.setProjectId();
        } catch (error) {
            this.logger.error('[GLOBAL-SET] > Error :' + error);
            return;
        }

        /** SET main Paramiters */
        this.setMainParametersFromSettings(globals);

        /**SET TENANT parameter */
        this.globals.tenant = this.appConfigService.getConfig().firebaseConfig.tenant
        /**SET LOGLEVEL parameter */
        this.globals.logLevel = this.appConfigService.getConfig().logLevel
        /**SET PERSISTENCE parameter */
        this.globals.persistence = this.appConfigService.getConfig().authPersistence

        // ------------------------------- //
        /** LOAD PARAMETERS FROM SERVER
         * load parameters from server
         * set parameters in globals
        */
        // const projectid = globals.projectid;
        this.getProjectParametersById(projectid).subscribe( response => {
            const project = response['project'];
            if (project) {
                that.globals.project.initialize(
                    project['id'],
                    project['activeOperatingHours'],
                    project['channels'],
                    project['name'],
                    project['createdAt'],
                    project['createdBy'],
                    project['isActiveSubscription'],
                    project['profile'],
                    project['agents'],
                    project['trialDays'],
                    project['type'],
                    project['status'],
                    project['trialDaysLeft'],
                    project['trialExpired'],
                    project['updatedAt'],
                    project['versions']
                );
            }
            // console.log('globals.project ----------------->', that.globals.project);
            that.setParameters(response);
        }, (error) => {
            // console.log('2 - ::getProjectParametersById', error);
            that.setParameters(null);
        }, () => {
            // console.log('3 - setParameters ');
            // that.setParameters(null);
        });

    }

    /** SET PROGECTID **
     * set projectId with the following order:
     * 1 - get projectId from settings
     * 2 - get projectId from attributeHtml
     * 3 - get projectId from UrlParameters
    */
    setProjectId() {
        // get projectid for settings//
        try {
            const projectid = this.globals.windowContext['GPTMysiteSettings']['projectid'];
            if (projectid) { this.globals.projectid = projectid; }
            // this.globals.setParameter('projectid', projectid);
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setProjectId 1 > Error :' + error);
        }

        // get projectid for attributeHtml//
        try {
            const projectid = this.el.nativeElement.getAttribute('projectid');
            if (projectid) { this.globals.projectid = projectid; }
            // this.globals.setParameter('projectid', projectid);
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setProjectId 2 > Error :' + error);
        }

        // get projectid for UrlParameters//
        try {
            const projectid = getParameterByName(this.globals.windowContext, 'GPTMysite_projectid');
            if (projectid) { this.globals.projectid = projectid; }
            // this.globals.setParameter('projectid', projectid);
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setProjectId 3 > Error :' + error);
        }

        // this.logger.debug('[GLOBAL-SET] setProjectId projectid: ', this.globals.projectid);
        return this.globals.projectid;
    }

    /**
     * 1: get Project Id From Settings
     * recupero i parametri principali dal settings:
     * projectid
     * persistence
     * filterByRequester
     * userToken
     * userId
     * ...
     */
    // https://www.davidbcalhoun.com/2011/checking-for-undefined-null-and-empty-variables-in-javascript/
    setMainParametersFromSettings(globals: Globals) {
        let GPTMysiteSettings: any;
        try {
            const baseLocation = this.globals.windowContext['GPTMysite'].getBaseLocation();
            this.logger.debug('[GLOBAL-SET] 1 > baseLocation: ', baseLocation);
            if (typeof baseLocation !== 'undefined') { this.globals.baseLocation = baseLocation; }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings baseLocation > Error :', error);
        }
        try {
            GPTMysiteSettings = this.globals.windowContext['GPTMysiteSettings'];
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings GPTMysiteSettings > Error :', error);
        }
        try {
            const persistence = GPTMysiteSettings['persistence'];
            if (typeof persistence !== 'undefined') { this.globals.persistence = persistence; }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings persistence > Error :', error);
        }
        // try {
        //     const userToken = GPTMysiteSettings['userToken'];
        //     if (typeof userToken !== 'undefined') { this.globals.userToken = userToken; }
        // } catch (error) {
        //     this.logger.error('[GLOBAL-SET] setMainParametersFromSettings userToken > Error :', error);
        // }
        // try {
        //     const userId = GPTMysiteSettings['userId'];
        //     if (typeof userId !== 'undefined') { this.globals.userId = userId; }
        // } catch (error) {
        //     this.logger.error('[GLOBAL-SET] setMainParametersFromSettings userId > Error :', error);
        // }
        try {
            const filterByRequester = GPTMysiteSettings['filterByRequester'];
            this.logger.debug('[GLOBAL-SET] setMainParametersFromSettings  > filterByRequester: ', filterByRequester);
            if (typeof filterByRequester !== 'undefined') { this.globals.filterByRequester = (filterByRequester === true) ? true : false; }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings filterByRequester > Error :', error);
        }
        try {
            const isLogEnabled = GPTMysiteSettings['isLogEnabled'];
            if (typeof isLogEnabled !== 'undefined') { this.globals.isLogEnabled = (isLogEnabled === true) ? true : false; }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings isLogEnabled > Error :', error);
        }
        try {
            const departmentID = GPTMysiteSettings['departmentID'];
            if (typeof departmentID !== 'undefined') { this.globals.departmentID = departmentID; }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings departmentID > Error :', error);
        }

        try {
            const showAttachmentButton = GPTMysiteSettings['showAttachmentButton'];
            // tslint:disable-next-line:max-line-length
            if (typeof showAttachmentButton !== 'undefined') { this.globals.showAttachmentButton = (showAttachmentButton === true) ? true : false; }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings showAttachmentButton > Error :', error);
        }

        try {
            const showAllConversations = GPTMysiteSettings['showAllConversations'];
            // tslint:disable-next-line:max-line-length
            if (typeof showAllConversations !== 'undefined') { this.globals.showAllConversations = (showAllConversations === true) ? true : false; }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setMainParametersFromSettings showAllConversations > Error :', error);
        }


        // try {
        //     const privacyField = GPTMysiteSettings['privacyField'];
        //     if (typeof privacyField !== 'undefined') { this.globals.privacyField = privacyField; }
        // } catch (error) {
        //     this.logger.error('[GLOBAL-SET] setMainParametersFromSettings privacyField > Error :', error);
        // }


        // -------------------------------------- //
        // const windowContext = globals.windowContext;
        // if (!windowContext['GPTMysite']) {
        //     // mi trovo in una pg index senza iframe
        //     return;
        // } else {
        //     // mi trovo in una pg con iframe
        //     const baseLocation =  windowContext['GPTMysite'].getBaseLocation();
        //     if (baseLocation !== undefined) {
        //         globals.baseLocation = baseLocation;
        //     }
        // }

        // let TEMP: any;
        // const GPTMysiteSettings = windowContext['GPTMysiteSettings'];
        // TEMP = GPTMysiteSettings['projectid'];
        // if (TEMP !== undefined) {
        //     globals.projectid = TEMP;
        // }
        // TEMP = GPTMysiteSettings['persistence'];
        // // this.logger.debug('[GLOBAL-SET] setMainParametersFromSettings - persistence:: ', TEMP);
        // if (TEMP !== undefined) {
        //     globals.persistence = TEMP;
        //     // globals.setParameter('persistence', TEMP);
        // }
        // TEMP = GPTMysiteSettings['userToken'];
        // // this.logger.debug('[GLOBAL-SET] setMainParametersFromSettings - userToken:: ', TEMP);
        // if (TEMP !== undefined) {
        //     globals.userToken = TEMP;
        //     // globals.setParameter('userToken', TEMP);
        // }
        // TEMP = GPTMysiteSettings['userId'];
        // // this.logger.debug('[GLOBAL-SET] setMainParametersFromSettings - userId:: ', TEMP);
        // if (TEMP !== undefined) {
        //     globals.userId = TEMP;
        //     // globals.setParameter('userId', TEMP);
        // }
        // TEMP = GPTMysiteSettings['filterByRequester'];
        // // this.logger.debug('[GLOBAL-SET] setMainParametersFromSettings - filterByRequester:: ', TEMP);
        // if (TEMP !== undefined) {
        //     globals.filterByRequester = (TEMP === false) ? false : true;
        //     // globals.setParameter('filterByRequester', (TEMP === false) ? false : true);
        // }
        // TEMP = GPTMysiteSettings['isLogEnabled'];
        // // this.logger.debug('[GLOBAL-SET] setMainParametersFromSettings - isLogEnabled:: ', TEMP);
        // if (TEMP !== undefined) {
        //     globals.isLogEnabled = (TEMP === false) ? false : true;
        //     // globals.setParameter('isLogEnabled', (TEMP === false) ? false : true);
        // }
    }

    /**
     *
     */
    // setProjectIdAndPrimaryParametersFromEl(el: ElementRef, globals: Globals) {
    //     // https://stackoverflow.com/questions/45732346/externally-pass-values-to-an-angular-application
    //     let TEMP: any;
    //     TEMP = el.nativeElement.getAttribute('projectid');
    //     if (TEMP !== null) {
    //         globals.projectid = TEMP;
    //     }
    // }

    /**
     * 2: getProjectParametersByIdFromServer
     * recupero i parametri dal server
    */
    // getProjectParametersById(globals: Globals, el: ElementRef) {
    //     const that = this;
    //     return new Promise((res, rej) => {
    //         const id = globals.projectid;
    //         this.settingsService.getProjectParametersById(id)
    //         .subscribe(response => {
    //             res(response);
    //         },
    //         errMsg => {
    //             that.logger.error('[GLOBAL-SET] getProjectParametersById --> http ERROR MESSAGE', errMsg);
    //             rej(errMsg);
    //         },
    //         () => {
    //             that.logger.debug('[GLOBAL-SET] getProjectParametersById --> API ERROR NESSUNO');
    //             rej('NULL');
    //         });
    //     });
    // }

    /**
     * 3: setParameters
     * imposto i parametri secondo il seguente ordine:
     * A: se il server ha restituito dei parametri imposto i parametri in global
     * B: imposto i parametri recuperati da settings in global
     * C: imposto i parametri recuperati da attributes html in global
     * D: imposto i parametri recuperati da url parameters in global
     * E: imposto i parametri recuperati dallo storage in global
    */
    setParameters(response: any ) {
        this.logger.debug('[GLOBAL-SET] ***** setParameters ***** ', response)
        if (response !== null) {
            this.setVariablesFromService(this.globals, response);
        }
        this.setVariableFromStorage(this.globals);
        this.setVariablesFromSettings(this.globals);
        this.setVariablesFromAttributeHtml(this.globals, this.el);
        this.setVariablesFromUrlParameters(this.globals);
        this.setDepartmentFromExternal();
        /** set color with gradient from theme's colors */
        this.globals.setColorWithGradient();
        /** set css iframe from parameters */
        this.setCssIframe();

        this.logger.debug('[GLOBAL-SET] ***** END SET PARAMETERS *****');
        this.obsSettingsService.next(true);
    }

    /**
     *
     */
    setCssIframe() {
        this.globals.setParameter('isMobile', detectIfIsMobile(this.globals.windowContext));
        // tslint:disable-next-line:max-line-length
        // this.logger.debug('[GLOBAL-SET] ***** setCssIframe *****', this.globals.windowContext.document.getElementById('GPTMysitediv'));
        const divGPTMysiteiframe = this.globals.windowContext.document.getElementById('GPTMysitediv');
        if (!divGPTMysiteiframe) {
            return;
        }
        let marginX;
        if (this.globals.align === 'left') {
            divGPTMysiteiframe.classList.add('align-left');
            this.globals.isMobile? marginX= this.globals.mobileMarginX : marginX = this.globals.marginX
            divGPTMysiteiframe.style.left =  marginX;
        } else {
            divGPTMysiteiframe.classList.add('align-right');
            this.globals.isMobile? marginX= this.globals.mobileMarginX: marginX = this.globals.marginX
            divGPTMysiteiframe.style.right =  marginX;
        }

        if (this.globals.isMobile) {
            divGPTMysiteiframe.style.bottom =  this.globals.mobileMarginY
        } else {
            divGPTMysiteiframe.style.bottom =  this.globals.marginY;
        }
        // console.log('this.globals.fullscreenMode' + this.globals.fullscreenMode);
        if (this.globals.fullscreenMode === true) {
            divGPTMysiteiframe.style.left = 0;
            divGPTMysiteiframe.style.right = 0;
            divGPTMysiteiframe.style.top = 0;
            divGPTMysiteiframe.style.bottom = 0;
            divGPTMysiteiframe.style.width = '100%';
            divGPTMysiteiframe.style.height = '100%';
            divGPTMysiteiframe.style.maxHeight = 'none';
            divGPTMysiteiframe.style.maxWidth = 'none';
        }
    }
    /**
     * A: setVariablesFromService
     */
    setVariablesFromService(globals: Globals, response: any) {
        this.logger.debug('[GLOBAL-SET] > setVariablesFromService :' , response);
        this.globals = globals;
        // DEPARTMENTS
        try {
            const departments = response.departments;
            // console.log('---->departments', response.departments);
            if (typeof departments !== 'undefined') {
                // globals.setParameter('departments', response.departments);
                this.initDepartments(departments);
            }
        } catch (error) {
            this.initDepartments(null);
            this.logger.error('[GLOBAL-SET] setVariablesFromService > Error is departments: ', error);
        }

        // BOTS_RULES
        try{
            const botsRules = response.botsRules
            if (typeof botsRules !== 'undefined') {
                this.logger.debug('[GLOBAL-SET] setVariablesFromService > botsRules ::::', botsRules);
                this.globals.botsRules = botsRules
            }
        }catch(error){
            this.logger.error('[GLOBAL-SET] setVariablesFromService > Error is botsRules: ', error);
        }


        // AVAILABLE AGENTS
        try {
            const user_available = response.user_available;
            if (typeof user_available !== 'undefined') {
                this.logger.debug('[GLOBAL-SET] setVariablesFromService > user_available ::::', user_available);
                this.setAvailableAgentsStatus(user_available);
            }
        } catch (error) {
            this.setAvailableAgentsStatus(null);
            this.logger.error('[GLOBAL-SET] setVariablesFromService > Error is departments: ', error);
        }

        // WIDGET
        try {
            const variables = response.project.widget;
            if (typeof variables !== 'undefined') {
                for (const key of Object.keys(variables)) {
                    if (key === 'align' && variables[key] === 'left') {
                        const divWidgetContainer = globals.windowContext.document.getElementById('GPTMysitediv');
                        divWidgetContainer.style.left = '0!important';
                        globals['align']= 'left'
                    } else if (key === 'align' && variables[key] === 'right') {
                        const divWidgetContainer = globals.windowContext.document.getElementById('GPTMysitediv');
                        divWidgetContainer.style.right = '0!important';
                        globals['align']= 'right'
                    }
                    // if (variables[key] && variables[key] !== null && key !== 'online_msg')  {
                    //     globals[key] = stringToBoolean(variables[key]); //-> fare test perchè se param è !== string allora ritorna string e non boolean
                    // }
                    if (variables.hasOwnProperty('calloutTimer')) {
                        globals['calloutTimer'] = variables['calloutTimer'];
                    }
                    if (variables.hasOwnProperty('dynamicWaitTimeReply')) {
                        globals['dynamicWaitTimeReply'] =  stringToBoolean(variables['dynamicWaitTimeReply']);
                    }
                    if (variables.hasOwnProperty('logoChat')) {
                        globals['logoChat'] = variables['logoChat'];
                    }
                    if (variables.hasOwnProperty('preChatForm')) {
                        globals['preChatForm'] = variables['preChatForm'];
                    }
                    if (variables.hasOwnProperty('preChatFormCustomFieldsEnabled')) {
                        if(variables.hasOwnProperty('preChatFormJson'))
                            globals['preChatFormJson'] = variables['preChatFormJson'];
                    }
                    if (variables.hasOwnProperty('themeColor')) {
                        globals['themeColor'] = variables['themeColor'];
                        globals['bubbleSentBackground']=variables['themeColor'];
                        globals['bubbleSentTextColor']= invertColor(variables['themeColor'], true);

                        // globals['buttonBackgroundColor']= invertColor(variables['themeColor'], true);
                        globals['buttonTextColor'] = variables['themeColor'];
                        // globals['buttonHoverTextColor'] = invertColor(variables['themeColor'], true);
                        globals['buttonHoverBackgroundColor'] = variables['themeColor'];
                    }
                    if (variables.hasOwnProperty('themeColorOpacity')) {
                        // globals[key] = stringToBoolean(variables[key]); -> fare test perchè se param è !== string allora ritorna string e non boolean
                        globals['themeColorOpacity'] = variables['themeColorOpacity'];
                        // globals['bubbleMsgSentTextColor'] = variables['themeForegroundColor'];
                    }
                    if (variables.hasOwnProperty('themeForegroundColor')) {
                        // globals[key] = stringToBoolean(variables[key]); -> fare test perchè se param è !== string allora ritorna string e non boolean
                        globals['themeForegroundColor'] = variables['themeForegroundColor'];
                        // globals['bubbleMsgSentTextColor'] = variables['themeForegroundColor'];
                    }
                    if (variables.hasOwnProperty('nativeRating')) {
                        globals['nativeRating'] = variables['nativeRating'];
                    }
                    if (variables.hasOwnProperty('poweredBy')) {
                        globals['poweredBy'] = variables['poweredBy'];
                    }
                    if (variables.hasOwnProperty('baloonImage')) {
                        globals['baloonImage'] = variables['baloonImage'];
                    }
                    if (variables.hasOwnProperty('allowReopen')) {
                        globals['allowReopen'] = variables['allowReopen'];
                        if(globals.allowReopen && !globals.showInfoMessage.includes('CHAT_CLOSED')){
                            globals.showInfoMessage.push('CHAT_CLOSED')
                        }
                    }
                    if (variables.hasOwnProperty('singleConversation')) {
                        globals['singleConversation'] = variables['singleConversation'];
                    }
                    if (variables.hasOwnProperty('themeColorOpacity')) {
                        globals['themeColorOpacity'] = variables['themeColorOpacity'];
                    }
                    if (variables.hasOwnProperty('fileUploadAccept')) {
                        globals['fileUploadAccept'] = variables['fileUploadAccept'];
                    }
                    if (variables.hasOwnProperty('displayOnDesktop')) {
                        globals['displayOnDesktop'] = variables['displayOnDesktop'];
                    }
                    if (variables.hasOwnProperty('displayOnMobile')) {
                        globals['displayOnMobile'] = variables['displayOnMobile'];
                    }
                    if (variables.hasOwnProperty('onPageChangeVisibilityDesktop')) {
                        globals['onPageChangeVisibilityDesktop'] = variables['onPageChangeVisibilityDesktop'];
                    }
                    if (variables.hasOwnProperty('onPageChangeVisibilityMobile')) {
                        globals['onPageChangeVisibilityMobile'] = variables['onPageChangeVisibilityMobile'];
                    }

                }
            }
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setVariablesFromService widget > Error :', error);
        }

        // IP
        try {
            const strIp = response['ip'];
            const IP = strIp.split(',').shift();
            if ( !this.globals.attributes ) {
                this.globals.attributes = {};
            }
            this.globals.attributes['ipAddress'] = IP;
            this.globals.setAttributeParameter('ipAddress', IP);
            this.logger.debug('[GLOBAL-SET] setVariablesFromService > ipAddress :', IP);

            // console.log('this.globals.attributes.IP ----------------->', this.globals.attributes);
        } catch (error) {
            this.logger.error('[GLOBAL-SET] setVariablesFromService > ipAddress > Error :', error);
        }

        this.appStorageService.setItem('attributes', JSON.stringify(this.globals.attributes))

        // if (response && response.project && response.project.widget !== null) {
        //     this.logger.debug('[GLOBAL-SET] setVariablesFromService response.widget: ', response.project.widget);
        //     const variables = response.project.widget;
        //     if (!variables || variables === undefined) {
        //         return;
        //     }
        //     for (const key of Object.keys(variables)) {
        //         // this.logger.debug('[GLOBAL-SET] setVariablesFromService SET globals from service KEY ---------->', key);
        //         // this.logger.debug('[GLOBAL-SET] setVariablesFromService SET globals from service VAL ---------->', variables[key]);
        //         // sposto l'intero frame a sx se align è = left
        //         if (key === 'align' && variables[key] === 'left') {
        //             const divWidgetContainer = globals.windowContext.document.getElementById('GPTMysiteiframe');
        //             divWidgetContainer.style.left = '0';
        //         }
        //         if (variables[key] && variables[key] !== null) {
        //             globals[key] = stringToBoolean(variables[key]);
        //         }
        //     }
        //     // this.logger.error('[GLOBAL-SET] setVariablesFromService SET globals == ---------->', globals);
        // }
    }

    /**
    * B: getVariablesFromSettings
    */
    setVariablesFromSettings(globals: Globals) {
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings');
        const windowContext = globals.windowContext;
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings windowContext', globals.windowContext);
        if (!windowContext['GPTMysite']) {
            return;
        } else {
            const baseLocation =  windowContext['GPTMysite'].getBaseLocation();
            if (baseLocation !== undefined) {
                // globals.setParameter('baseLocation', baseLocation);
                globals.baseLocation = baseLocation;
            }
        }
        let TEMP: any;
        const GPTMysiteSettings = windowContext['GPTMysiteSettings'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > GPTMysiteSettings: ', GPTMysiteSettings);
        TEMP = GPTMysiteSettings['tenant'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings >  tenant:: ', TEMP);
        if (TEMP !== undefined) {
            globals.tenant = TEMP;
            // globals.setParameter('tenant', TEMP);
        }
        TEMP = GPTMysiteSettings['recipientId'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > recipientId:: ', TEMP);
        if (TEMP !== undefined) {
            globals.recipientId = TEMP;
            // globals.setParameter('recipientId', TEMP);
        }
        TEMP = GPTMysiteSettings['widgetTitle'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > widgetTitle:: ', TEMP);
        if (TEMP !== undefined) {
            globals.widgetTitle = TEMP;
            // globals.setParameter('widgetTitle', TEMP);
        }
        // TEMP = GPTMysiteSettings['poweredBy'];
        // // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > poweredBy:: ', TEMP);
        // if (TEMP !== undefined) {
        //     globals.poweredBy = TEMP;
        //     // globals.setParameter('poweredBy', TEMP);
        // }
        TEMP = GPTMysiteSettings['userEmail'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > userEmail:: ', TEMP);
        if (TEMP !== undefined) {
            globals.userEmail = TEMP;
            // globals.setParameter('userEmail', TEMP);
        }
        TEMP = GPTMysiteSettings['userFullname'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > userFullname:: ', TEMP);
        if (TEMP !== undefined) {
            globals.userFullname = TEMP;
            // globals.setParameter('userFullname', TEMP);
        }
        TEMP = GPTMysiteSettings['preChatForm'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > preChatForm:: ', TEMP);
        if (TEMP !== undefined) {
            globals.preChatForm = (TEMP === true) ? true : false;
            // globals.setParameter('preChatForm', (TEMP === false) ? false : true);
        }
        /** @deprecated */
        TEMP = GPTMysiteSettings['isOpen'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > isOpen:: ', TEMP);
        if (TEMP !== undefined) {
            globals.isOpen = (TEMP === true) ? true : false;
            // globals.setParameter('isOpen', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['open'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > open:: ', TEMP);
        if (TEMP !== undefined) {
            globals.isOpen = (TEMP === true) ? true : false;
            // globals.setParameter('open', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['channelType'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > channelType:: ', TEMP);
        if (TEMP !== undefined) {
            globals.channelType = TEMP;
            // globals.setParameter('channelType', TEMP);
        }
        TEMP = GPTMysiteSettings['lang'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > lang:: ', TEMP);
        if (TemplateBindingParseResult) {
            globals.lang = TEMP;
            // globals.setParameter('lang', TEMP);
        }
        TEMP = GPTMysiteSettings['align'];
        if (TEMP !== undefined) {
            globals.align = TEMP;
            // const divWidgetContainer = windowContext.document.getElementById('GPTMysitediv');
            // if (globals.align === 'left') {
            //     divWidgetContainer.classList.add('align-left');
            // } else {
            //     divWidgetContainer.classList.add('align-right');
            // }
        }
        TEMP = GPTMysiteSettings['marginX'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > marginX:: ', TEMP);
        if (TEMP !== undefined) {
            globals.marginX = TEMP;
            // globals.setParameter('marginX', TEMP);
        }
        TEMP = GPTMysiteSettings['marginY'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > marginY:: ', TEMP);
        if (TEMP !== undefined) {
            globals.marginY = TEMP;
            // globals.setParameter('marginY', TEMP);
        }
        TEMP = GPTMysiteSettings['mobileMarginX'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > mobileMarginX:: ', TEMP);
        if (TEMP !== undefined) {
            globals.mobileMarginX = TEMP;
            // globals.setParameter('mobileMarginX', TEMP);
        }
        TEMP = GPTMysiteSettings['mobileMarginY'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > mobileMarginY:: ', TEMP);
        if (TEMP !== undefined) {
            globals.mobileMarginY = TEMP;
            // globals.setParameter('mobileMarginY', TEMP);
        }
        TEMP = GPTMysiteSettings['launcherWidth'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > launcherWidth:: ', TEMP);
        if (TEMP !== undefined) {
            globals.launcherWidth = TEMP;
            // globals.setParameter('launcherWidth', TEMP);
        }
        TEMP = GPTMysiteSettings['launcherHeight'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > launcherHeight:: ', TEMP);
        if (TEMP !== undefined) {
            globals.launcherHeight = TEMP;
            // globals.setParameter('launcherHeight', TEMP);
        }
        TEMP = GPTMysiteSettings['baloonImage'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > baloonImage:: ', TEMP);
        if (TEMP !== undefined) {
            globals.baloonImage = TEMP;
            // globals.setParameter('baloonImage', TEMP);
        }
        TEMP = GPTMysiteSettings['baloonShape'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > baloonShape:: ', TEMP);
        if (TEMP !== undefined) {
            globals.baloonShape = TEMP;
            // globals.setParameter('baloonShape', TEMP);
        }
        TEMP = GPTMysiteSettings['calloutTimer'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > calloutTimer:: ', TEMP);
        if (TEMP !== undefined) {
            globals.calloutTimer = TEMP;
            // globals.setParameter('calloutTimer', TEMP);
        }
        TEMP = GPTMysiteSettings['calloutTitle'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > calloutTitle:: ', TEMP);
        if (TEMP !== undefined) {
            globals.calloutTitle = TEMP;
            // globals.setParameter('calloutTitle', TEMP);
        }
        TEMP = GPTMysiteSettings['calloutMsg'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > calloutMsg:: ', TEMP);
        if (TEMP !== undefined) {
            globals.calloutMsg = TEMP;
            // globals.setParameter('calloutMsg', TEMP);
        }
        TEMP = GPTMysiteSettings['fullscreenMode'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > fullscreenMode:: ', TEMP);
        if (TEMP !== undefined) {
            globals.fullscreenMode = TEMP;
            // globals.setParameter('fullscreenMode', TEMP);
        }
        TEMP = GPTMysiteSettings['hideHeaderCloseButton'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > hideHeaderCloseButton:: ', TEMP);
        if (TEMP !== undefined) {
            globals.hideHeaderCloseButton = TEMP;
            // globals.setParameter('hideHeaderCloseButton', TEMP);
        }
        TEMP = GPTMysiteSettings['themeColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > themeColor:: ', TEMP);
        if (TEMP !== undefined) {
            globals.themeColor = convertColorToRGBA(TEMP, 100);
            globals.bubbleSentBackground = convertColorToRGBA(TEMP, 100);
            globals.bubbleSentTextColor = invertColor(TEMP, true)

            // globals.buttonBackgroundColor = invertColor(TEMP, true);
            globals.buttonTextColor = convertColorToRGBA(TEMP, 100);
            globals.buttonHoverBackgroundColor = convertColorToRGBA(TEMP, 100);
            // globals.buttonHoverTextColor = invertColor(TEMP, true);
        }
        TEMP = GPTMysiteSettings['themeColorOpacity'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > themeColorOpacity:: ', TEMP);
        if (TEMP !== undefined) {
            globals.themeColorOpacity = +TEMP;
        }
        TEMP = GPTMysiteSettings['themeForegroundColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > themeForegroundColor:: ', TEMP);
        if (TEMP !== undefined) {
            globals.themeForegroundColor = convertColorToRGBA(TEMP, 100);
            // globals.bubbleMsgSentTextColor = convertColorToRGBA(TEMP, 100);
            // globals.setParameter('themeForegroundColor', convertColorToRGBA(TEMP, 100));
        }
        TEMP = GPTMysiteSettings['allowTranscriptDownload'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > allowTranscriptDownload:: ', TEMP);
        if (TEMP !== undefined) {
            globals.allowTranscriptDownload = (TEMP === true) ? true : false;
            // globals.setParameter('allowTranscriptDownload', TEMP);
        }
        TEMP = GPTMysiteSettings['startFromHome'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > startFromHome:: ', TEMP);
        if (TEMP !== undefined) {
            globals.startFromHome = (TEMP === true) ? true : false;
            // globals.setParameter('startFromHome', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['logoChat'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > logoChat:: ', TEMP);
        if (TEMP !== undefined) {
            globals.logoChat = TEMP;
            // globals.setParameter('logoChat', TEMP);
        }
        TEMP = GPTMysiteSettings['welcomeTitle'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > welcomeTitle:: ', TEMP);
        if (TEMP !== undefined) {
            globals.welcomeTitle = TEMP;
            // globals.setParameter('welcomeTitle', TEMP);
        }
        TEMP = GPTMysiteSettings['welcomeMsg'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > welcomeMsg:: ', TEMP);
        if (TEMP !== undefined) {
            globals.welcomeMsg = TEMP;
            // globals.setParameter('welcomeMsg', TEMP);
        }
        TEMP = GPTMysiteSettings['autoStart'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > autoStart:: ', TEMP);
        if (TEMP !== undefined) {
            globals.autoStart = (TEMP === true) ? true : false;
            // globals.setParameter('autoStart', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['startHidden'];
        if (TEMP !== undefined) {
            globals.startHidden = (TEMP === true) ? true : false;
        }
        TEMP = GPTMysiteSettings['isShown'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > isShown:: ', TEMP);
        if (TEMP !== undefined) {
            globals.isShown = (TEMP === true) ? true : false;
            // globals.setParameter('isShown', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['filterByRequester'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > filterByRequester:: ', TEMP);
        if (TEMP !== undefined) {
            globals.filterByRequester = (TEMP === true) ? true : false;
            // globals.setParameter('filterByRequester', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['showWaitTime'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > showWaitTime:: ', TEMP);
        if (TEMP !== undefined) {
            globals.showWaitTime = (TEMP === true) ? true : false;
            // globals.setParameter('showWaitTime', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['showAvailableAgents'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > showAvailableAgents:: ', TEMP);
        if (TEMP !== undefined) {
            globals.showAvailableAgents = (TEMP === true) ? true : false;
            // globals.setParameter('showAvailableAgents', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['showLogoutOption'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > showLogoutOption:: ', TEMP);
        if (TEMP !== undefined) {
            globals.showLogoutOption = (TEMP === true) ? true : false;
            // globals.setParameter('showLogoutOption', (TEMP === false) ? false : true);
        }
        TEMP = GPTMysiteSettings['customAttributes'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > customAttributes:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.customAttributes = TEMP;
        }
        TEMP = GPTMysiteSettings['showAttachmentButton'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > showAttachmentButton:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.showAttachmentButton = (TEMP === true) ? true : false;
        }
        TEMP = GPTMysiteSettings['showAllConversations'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > showAllConversations:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.showAllConversations = (TEMP === true) ? true : false;
        }
        // TEMP = GPTMysiteSettings['privacyField'];
        // // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > privacyField:: ', TEMP]);
        // if (TEMP !== undefined) {
        //     globals.privacyField = TEMP;
        // }
        TEMP = GPTMysiteSettings['dynamicWaitTimeReply'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > dynamicWaitTimeReply:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.dynamicWaitTimeReply =  stringToBoolean(TEMP);
        }
        TEMP = GPTMysiteSettings['soundEnabled'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > soundEnabled:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.soundEnabled = TEMP;
        }
        TEMP = GPTMysiteSettings['openExternalLinkButton'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > openExternalLinkButton:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.openExternalLinkButton = TEMP;
        }
        TEMP = GPTMysiteSettings['hideCloseConversationOptionMenu'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > hideHeaderConversationOptionsMenu:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.hideCloseConversationOptionMenu = (TEMP === true) ? true : false;;
        }
        TEMP = GPTMysiteSettings['hideRestartConversationOptionsMenu'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > hideHeaderConversationOptionsMenu:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.hideRestartConversationOptionsMenu = (TEMP === true) ? true : false;;
        }
        TEMP = GPTMysiteSettings['hideHeaderConversationOptionsMenu'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > hideHeaderConversationOptionsMenu:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.hideHeaderConversationOptionsMenu = (TEMP === true) ? true : false;;
        }
        TEMP = GPTMysiteSettings['hideSettings'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > hideSettings:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.hideSettings = (TEMP === true) ? true : false;;
        }
        TEMP = GPTMysiteSettings['logLevel'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > logLevel:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.logLevel = TEMP;
        }
        TEMP = GPTMysiteSettings['preChatFormJson'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > preChatFormJson:: ', TEMP]);
        if (TEMP !== undefined) {
            if(isJsonArray(TEMP)){
                globals.preChatFormJson = TEMP;
            }

        }
        TEMP = GPTMysiteSettings['bubbleSentBackground'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > bubbleSentBackground:: ', TEMP);
        if (TEMP !== undefined) {
            globals.bubbleSentBackground = convertColorToRGBA(TEMP, 100);
            globals.bubbleSentTextColor = invertColor(TEMP, true);

            // globals.buttonBackgroundColor= invertColor(TEMP, true);
            globals.buttonTextColor = convertColorToRGBA(TEMP, 100);
            globals.buttonHoverBackgroundColor = convertColorToRGBA(TEMP, 100);
            // globals.buttonHoverTextColor = invertColor(TEMP, true);
        }
        TEMP = GPTMysiteSettings['bubbleSentTextColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > bubbleSentTextColor:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.bubbleSentTextColor = convertColorToRGBA(TEMP, 100);
        }
        TEMP = GPTMysiteSettings['bubbleReceivedBackground'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > bubbleReceivedBackground:: ', TEMP);
        if (TEMP !== undefined) {
            globals.bubbleReceivedBackground = convertColorToRGBA(TEMP, 100);
            globals.bubbleReceivedTextColor = invertColor(TEMP, true)
        }
        TEMP = GPTMysiteSettings['bubbleReceivedTextColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > bubbleReceivedTextColor:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.bubbleReceivedTextColor = convertColorToRGBA(TEMP, 100);
        }
        TEMP = GPTMysiteSettings['fontSize'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > fontSize:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.fontSize = TEMP;
        }
        TEMP = GPTMysiteSettings['fontFamily'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > fontFamily:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.fontFamily = TEMP;
        }
        TEMP = GPTMysiteSettings['buttonFontSize'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > buttonFontSize:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.buttonFontSize = TEMP;
        }
        TEMP = GPTMysiteSettings['buttonBackgroundColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > buttonBackgroundColor:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.buttonBackgroundColor = convertColorToRGBA(TEMP, 100);
            globals.buttonTextColor = invertColor(TEMP, true);
            globals.buttonHoverBackgroundColor = invertColor(TEMP, true);
            globals.buttonHoverTextColor = convertColorToRGBA(TEMP, 100);
        }
        TEMP = GPTMysiteSettings['buttonTextColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > buttonTextColor:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.buttonTextColor = convertColorToRGBA(TEMP, 100);
            globals.buttonHoverBackgroundColor = convertColorToRGBA(TEMP, 100);
        }
        TEMP = GPTMysiteSettings['buttonHoverBackgroundColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > buttonHoverBackgroundColor:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.buttonHoverBackgroundColor = convertColorToRGBA(TEMP, 100);
        }
        TEMP = GPTMysiteSettings['buttonHoverTextColor'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > buttonHoverTextColor:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.buttonHoverTextColor = convertColorToRGBA(TEMP, 100);
        }
        TEMP = GPTMysiteSettings['singleConversation'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > singleConversation:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.singleConversation = (TEMP === true) ? true : false;
        }
        TEMP = GPTMysiteSettings['restartConversation'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > continueConversationBeforeTime:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.restartConversation = (TEMP === true) ? true : false;
        }
        TEMP = GPTMysiteSettings['nativeRating'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > nativeRating:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.nativeRating = (TEMP === true) ? true : false;
        }
        TEMP = GPTMysiteSettings['showInfoMessage'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > showBubbleInfoMessage:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.showInfoMessage = TEMP.split(',').map(key => { return key.trim()});
        }
        TEMP = GPTMysiteSettings['typingLocation'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > typingLocation:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.typingLocation = TEMP;
        }
        TEMP = GPTMysiteSettings['allowReopen'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > allowReopen:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.allowReopen = (TEMP === true) ? true : false;
            if(globals.allowReopen && !globals.showInfoMessage.includes('CHAT_CLOSED')){
                globals.showInfoMessage.push('CHAT_CLOSED')
            }
        }
        TEMP = GPTMysiteSettings['continueConversationBeforeTime'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > continueConversationBeforeTime:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.continueConversationBeforeTime = +TEMP;
        }
        TEMP = GPTMysiteSettings['participants'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > participants:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.participants = TEMP.split(',').map(key => { return key.trim()});
        }
        TEMP = GPTMysiteSettings['whatsappNumber'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > whatsappNumber:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.whatsappNumber = TEMP;
        }
        TEMP = GPTMysiteSettings['messangerPageTitle'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > messangerPageTitle:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.messangerPageTitle = TEMP;
        }
        TEMP = GPTMysiteSettings['telegramUsername'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > telegramUsername:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.telegramUsername = TEMP;
        }
        TEMP = GPTMysiteSettings['fileUploadAccept'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > telegramUsername:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.fileUploadAccept = TEMP;
        }
        TEMP = GPTMysiteSettings['disconnetTime'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > disconnetTime:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.disconnetTime = +TEMP;
        }
        TEMP = GPTMysiteSettings['displayOnDesktop'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > displayOnDesktop:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.displayOnDesktop = (TEMP === true) ? true : false;
        }
        TEMP = GPTMysiteSettings['displayOnMobile'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > displayOnMobile:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.displayOnMobile = (TEMP === true) ? true : false;
        }
        TEMP = GPTMysiteSettings['onPageChangeVisibilityDesktop'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > onPageChangeVisibilityDesktop:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.onPageChangeVisibilityDesktop = TEMP;
        }
        TEMP = GPTMysiteSettings['onPageChangeVisibilityMobile'];
        // this.logger.debug('[GLOBAL-SET] setVariablesFromSettings > onPageChangeVisibilityMobile:: ', TEMP]);
        if (TEMP !== undefined) {
            globals.onPageChangeVisibilityMobile = TEMP;
        }
    }

    /**
     * C: getVariablesFromAttributeHtml
     * desueto, potrebbe essere commentato.
     */
    setVariablesFromAttributeHtml(globals: Globals, el: ElementRef) {
        // this.logger.debug('[GLOBAL-SET] getVariablesFromAttributeHtml', el);
        // const projectid = el.nativeElement.getAttribute('projectid');
        // if (projectid !== null) {
        //     globals.setParameter('projectid', projectid);
        // }
        // https://stackoverflow.com/questions/45732346/externally-pass-values-to-an-angular-application
        let TEMP: any;
        TEMP = el.nativeElement.getAttribute('tenant');
        if (TEMP !== null) {
            this.globals.tenant = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('recipientId');
        if (TEMP !== null) {
            this.globals.recipientId = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('widgetTitle');
        if (TEMP !== null) {
            this.globals.widgetTitle = TEMP;
        }
        // TEMP = el.nativeElement.getAttribute('poweredBy');
        // if (TEMP !== null) {
        //     this.globals.poweredBy = TEMP;
        // }
        // TEMP = el.nativeElement.getAttribute('userId');
        // if (TEMP !== null) {
        //     this.globals.userId = TEMP;
        // }
        TEMP = el.nativeElement.getAttribute('userEmail');
        if (TEMP !== null) {
            this.globals.userEmail = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('userFullname');
        if (TEMP !== null) {
            this.globals.userFullname = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('preChatForm');
        if (TEMP !== null) {
            this.globals.preChatForm = (TEMP === true) ? true : false;
        }
        /** @deprecated */
        TEMP = el.nativeElement.getAttribute('isOpen');
        if (TEMP !== null) {
            this.globals.isOpen = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('open');
        if (TEMP !== null) {
            this.globals.isOpen = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('channelType');
        if (TEMP !== null) {
            this.globals.channelType = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('lang');
        if (TEMP !== null) {
            this.globals.lang = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('align');
        if (TEMP !== null) {
            this.globals.align = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('marginX');
        if (TEMP !== null) {
            this.globals.marginX = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('marginY');
        if (TEMP !== null) {
            this.globals.marginY = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('mobileMarginX');
        if (TEMP !== null) {
            this.globals.mobileMarginX = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('mobileMarginY');
        if (TEMP !== null) {
            this.globals.mobileMarginY = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('launcherWidth');
        if (TEMP !== null) {
            this.globals.launcherWidth = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('launcherHeight');
        if (TEMP !== null) {
            this.globals.launcherHeight= TEMP;
        }
        TEMP = el.nativeElement.getAttribute('baloonImage');
        if (TEMP !== null) {
            this.globals.baloonImage= TEMP;
        }
        TEMP = el.nativeElement.getAttribute('baloonShape');
        if (TEMP !== null) {
            this.globals.baloonShape= TEMP;
        }
        TEMP = el.nativeElement.getAttribute('calloutTimer');
        if (TEMP !== null) {
            this.globals.calloutTimer = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('welcomeMsg');
        if (TEMP !== null) {
            this.globals.welcomeMsg = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('welcomeTitle');
        if (TEMP !== null) {
            this.globals.welcomeTitle = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('calloutTitle');
        if (TEMP !== null) {
            this.globals.calloutTitle = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('calloutMsg');
        if (TEMP !== null) {
            this.globals.calloutMsg = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('startFromHome');
        if (TEMP !== null) {
            this.globals.startFromHome = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('logoChat');
        if (TEMP !== null) {
            this.globals.logoChat = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('autoStart');
        if (TEMP !== null) {
            this.globals.autoStart = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('startHidden');
        if (TEMP !== null) {
            this.globals.startHidden = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('isShown');
        if (TEMP !== null) {
            this.globals.isShown = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('isLogEnabled');
        if (TEMP !== null) {
            this.globals.isLogEnabled = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('filterByRequester');
        if (TEMP !== null) {
            this.globals.filterByRequester = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('showAttachmentButton');
        if (TEMP !== null) {
            this.globals.showAttachmentButton = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('departmentID');
        if (TEMP !== null) {
            this.globals.departmentID = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('showAllConversations');
        if (TEMP !== null) {
            this.globals.showAllConversations = (TEMP === true) ? true : false;
        }
        // TEMP = el.nativeElement.getAttribute('privacyField');
        // if (TEMP !== null) {
        //     this.globals.privacyField = TEMP;
        // }
        TEMP = el.nativeElement.getAttribute('dynamicWaitTimeReply');
        if (TEMP !== null) {
            this.globals.dynamicWaitTimeReply =  stringToBoolean(TEMP);
        }
        TEMP = el.nativeElement.getAttribute('soundEnabled');
        if (TEMP !== null) {
            this.globals.soundEnabled = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('openExternalLinkButton');
        if (TEMP !== null) {
            this.globals.openExternalLinkButton = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('hideHeaderConversationOptionsMenu');
        if (TEMP !== null) {
            this.globals.hideHeaderConversationOptionsMenu = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('hideCloseConversationOptionMenu');
        if (TEMP !== null) {
            this.globals.hideCloseConversationOptionMenu = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('hideRestartConversationOptionsMenu');
        if (TEMP !== null) {
            this.globals.hideRestartConversationOptionsMenu = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('hideSettings');
        if (TEMP !== null) {
            this.globals.hideSettings = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('logLevel');
        if (TEMP !== null) {
            this.globals.logLevel = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('preChatFormJson');
        if (TEMP !== null) {
            this.globals.preChatFormJson = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('fontSize');
        if (TEMP !== null) {
            this.globals.fontSize = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('fontFamily');
        if (TEMP !== null) {
            this.globals.fontFamily = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('buttonFontSize');
        if (TEMP !== null) {
            this.globals.buttonFontSize = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('buttonBackgroundColor');
        if (TEMP !== null) {
            this.globals.buttonBackgroundColor = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('buttonTextColor');
        if (TEMP !== null) {
            this.globals.buttonTextColor = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('buttonHoverBackgroundColor');
        if (TEMP !== null) {
            this.globals.buttonHoverBackgroundColor = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('buttonHoverTextColor');
        if (TEMP !== null) {
            this.globals.buttonHoverTextColor = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('singleConversation');
        if (TEMP !== null) {
            this.globals.singleConversation = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('restartConversation');
        if (TEMP !== null) {
            this.globals.restartConversation = (TEMP === true) ? true : false;;
        }
        TEMP = el.nativeElement.getAttribute('nativeRating');
        if (TEMP !== null) {
            this.globals.nativeRating = (TEMP === true) ? true : false;
        }
        TEMP = el.nativeElement.getAttribute('showInfoMessage');
        if (TEMP !== null) {
            this.globals.showInfoMessage = TEMP.split(',').map(key => { return key.trim()})
        }
        TEMP = el.nativeElement.getAttribute('typingLocation');
        if (TEMP !== null) {
            this.globals.typingLocation = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('allowReopen');
        if (TEMP !== null) {
            this.globals.allowReopen = TEMP;
            if(this.globals.allowReopen && !this.globals.showInfoMessage.includes('CHAT_CLOSED')){
                this.globals.showInfoMessage.push('CHAT_CLOSED')
            }
        }
        TEMP = el.nativeElement.getAttribute('continueConversationBeforeTime');
        if (TEMP !== null) {
            this.globals.continueConversationBeforeTime = +TEMP;
        }
        TEMP = el.nativeElement.getAttribute('participants');
        if (TEMP !== null) {
            this.globals.participants = TEMP.split(',').map(key => { return key.trim()});
        }
        TEMP = el.nativeElement.getAttribute('fileUploadAccept');
        if (TEMP !== null) {
            this.globals.fileUploadAccept = TEMP;
        }
        TEMP = el.nativeElement.getAttribute('disconnetTime');
        if (TEMP !== null) {
            this.globals.disconnetTime = +TEMP;
        }


    }


    /**
    * D: setVariableFromUrlParameters
    */
    setVariablesFromUrlParameters(globals: Globals) {
        this.logger.debug('[GLOBAL-SET] setVariablesFromUrlParameters: ');
        const windowContext = globals.windowContext;
        let TEMP: any;
        TEMP = getParameterByName(windowContext, 'GPTMysite_tenant');
        if (TEMP) {
            globals.tenant = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_recipientId');
        if (TEMP) {
            globals.recipientId = stringToBoolean(TEMP);
        }

        // TEMP = getParameterByName(windowContext, 'GPTMysite_projectid');
        // if (TEMP) {
        //     globals.projectid = stringToBoolean(TEMP);
        // }

        TEMP = getParameterByName(windowContext, 'GPTMysite_widgetTitle');
        if (TEMP) {
            globals.widgetTitle = stringToBoolean(TEMP);
        }

        // TEMP = getParameterByName(windowContext, 'GPTMysite_poweredBy');
        // if (TEMP) {
        //     globals.poweredBy = stringToBoolean(TEMP);
        // }

        // TEMP = getParameterByName(windowContext, 'GPTMysite_userid');
        // if (TEMP) {
        //     globals.userId = stringToBoolean(TEMP);
        // }

        TEMP = getParameterByName(windowContext, 'GPTMysite_userEmail');
        if (TEMP) {
            globals.userEmail = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_userFullname');
        if (TEMP) {
            globals.userFullname = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_channelType');
        if (TEMP) {
            globals.channelType = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_lang');
        if (TEMP) {
            globals.lang = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_calloutTimer');
        if (TEMP) {
            globals.calloutTimer = Number(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_align');
        if (TEMP) {
            globals.align = stringToBoolean(TEMP);
            // const divWidgetContainer = windowContext.document.getElementById('GPTMysitediv');
            // if (globals.align === 'left') {
            //     divWidgetContainer.classList.add('align-left');
            // } else {
            //     divWidgetContainer.classList.add('align-right');
            // }
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_marginX');
        if (TEMP) {
            globals.marginX = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_marginY');
        if (TEMP) {
            globals.marginY = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_mobileMarginX');
        if (TEMP) {
            globals.mobileMarginX = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_mobileMarginY');
        if (TEMP) {
            globals.mobileMarginY = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_launcherWidth');
        if (TEMP) {
            globals.launcherWidth = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_launcherHeight');
        if (TEMP) {
            globals.launcherHeight = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_baloonImage');
        if (TEMP) {
            globals.baloonImage = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_baloonShape');
        if (TEMP) {
            globals.baloonShape = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_welcomeMsg');
        if (TEMP) {
            globals.welcomeMsg = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_calloutTitle');
        if (TEMP) {
            globals.calloutTitle = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_calloutMsg');
        if (TEMP) {
            globals.calloutMsg = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_hideHeaderCloseButton');
        if (TEMP) {
            globals.hideHeaderCloseButton = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_themeColor');
        if (TEMP) {
            const themecolor = stringToBoolean(TEMP);
            globals.themeColor = convertColorToRGBA(themecolor, 100);
            globals.bubbleSentBackground = convertColorToRGBA(themecolor, 100);

            // globals.buttonBackgroundColor = invertColor(themecolor, true);
            globals.buttonTextColor = convertColorToRGBA(themecolor, 100);
            globals.buttonHoverBackgroundColor = convertColorToRGBA(themecolor, 100);
            // globals.buttonHoverTextColor = invertColor(themecolor, true);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_themeColorOpacity');
        if (TEMP) {
            globals.themeColorOpacity = +TEMP
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_themeForegroundColor');
        if (TEMP) {
            const themeforegroundcolor = stringToBoolean(TEMP);
            globals.themeForegroundColor = convertColorToRGBA(themeforegroundcolor, 100);
            globals.bubbleSentTextColor = convertColorToRGBA(themeforegroundcolor, 100);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_logoChat');
        if (TEMP) {
            globals.logoChat = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_welcomeTitle');
        if (TEMP) {
            globals.welcomeTitle = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_autoStart');
        if (TEMP) {
            globals.autoStart = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_startHidden');
        if (TEMP) {
            globals.startHidden = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_isShown');
        if (TEMP) {
            globals.isShown = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_isLogEnabled');
        if (TEMP) {
            globals.isLogEnabled = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_filterByRequester');
        if (TEMP) {
            globals.filterByRequester = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_showWaitTime');
        if (TEMP) {
            globals.showWaitTime = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_showAvailableAgents');
        if (TEMP) {
            globals.showAvailableAgents = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_showLogoutOption');
        if (TEMP) {
            globals.showLogoutOption = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_preChatForm');
        if (TEMP) {
            globals.preChatForm = stringToBoolean(TEMP);
        }

        /** @deprecated */
        TEMP = getParameterByName(windowContext, 'GPTMysite_isOpen');
        if (TEMP) {
            globals.isOpen = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_open');
        if (TEMP) {
            globals.isOpen = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_allowTranscriptDownload');
        if (TEMP) {
            globals.allowTranscriptDownload = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_startFromHome');
        if (TEMP) {
            globals.startFromHome = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_fullscreenMode');
        if (TEMP) {
            globals.fullscreenMode = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_customAttributes');
        if (TEMP) {
            globals.customAttributes = JSON.parse(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_showAttachmentButton');
        if (TEMP) {
            globals.showAttachmentButton = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_departmentID');
        if (TEMP) {
            globals.departmentID = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_persistence');
        if (TEMP) {
            globals.persistence = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_showAllConversations');
        if (TEMP) {
            globals.showAllConversations = stringToBoolean(TEMP);
        }

        // TEMP = getParameterByName(windowContext, 'GPTMysite_privacyField');
        // if (TEMP) {
        //     globals.privacyField = TEMP;
        // }

        TEMP = getParameterByName(windowContext, 'GPTMysite_jwt');
        if (TEMP) {
            globals.jwt = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_dynamicWaitTimeReply');
        if (TEMP) {
            globals.dynamicWaitTimeReply = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_soundEnabled');
        if (TEMP) {
            globals.soundEnabled = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_openExternalLinkButton');
        if (TEMP) {
            globals.openExternalLinkButton = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_hideHeaderConversationOptionsMenu');
        if (TEMP) {
            globals.hideHeaderConversationOptionsMenu = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_hideCloseConversationOptionMenu');
        if (TEMP) {
            globals.hideCloseConversationOptionMenu = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_hideRestartConversationOptionsMenu');
        if (TEMP) {
            globals.hideRestartConversationOptionsMenu = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_hideSettings');
        if (TEMP) {
            globals.hideSettings = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_logLevel');
        if (TEMP) {
            globals.logLevel = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_preChatFormJson');
        if (TEMP) {
            globals.preChatFormJson = JSON.parse(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_bubbleSentBackground');
        if (TEMP) {
            const bubbleSentBackground = stringToBoolean(TEMP);
            globals.bubbleSentBackground = convertColorToRGBA(bubbleSentBackground, 100);
            globals.bubbleSentTextColor = invertColor(bubbleSentBackground, true)

            // globals.buttonBackgroundColor= invertColor(bubbleSentBackground, true);
            globals.buttonTextColor = convertColorToRGBA(bubbleSentBackground, 100);
            globals.buttonHoverBackgroundColor = convertColorToRGBA(bubbleSentBackground, 100);
            // globals.buttonHoverTextColor = invertColor(bubbleSentBackground, true);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_bubbleSentTextColor');
        if (TEMP) {
            const bubbleSentTextColor = stringToBoolean(TEMP);
            globals.bubbleSentTextColor = convertColorToRGBA(bubbleSentTextColor, 100);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_bubbleReceivedBackground');
        if (TEMP) {
            const bubbleReceivedBackground = stringToBoolean(TEMP);
            globals.bubbleReceivedBackground = convertColorToRGBA(bubbleReceivedBackground, 100);
            globals.bubbleReceivedTextColor = invertColor(TEMP, true)
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_bubbleReceivedTextColor');
        if (TEMP) {
            const bubbleReceivedTextColor = stringToBoolean(TEMP);
            globals.bubbleReceivedTextColor = convertColorToRGBA(bubbleReceivedTextColor, 100);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_fontSize');
        if (TEMP) {
            globals.fontSize = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_fontFamily');
        if (TEMP) {
            globals.fontFamily = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_buttonFontSize');
        if (TEMP) {
            globals.buttonFontSize = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_buttonBackgroundColor');
        if (TEMP) {
            const buttonBackgroundColor = stringToBoolean(TEMP);
            globals.buttonBackgroundColor = convertColorToRGBA(buttonBackgroundColor, 100);
            globals.buttonTextColor = invertColor(buttonBackgroundColor, true);
            globals.buttonHoverBackgroundColor = invertColor(buttonBackgroundColor, true);
            globals.buttonHoverTextColor = convertColorToRGBA(buttonBackgroundColor, 100);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_buttonTextColor');
        if (TEMP) {
            const buttonTextColor = stringToBoolean(TEMP);
            globals.buttonTextColor = convertColorToRGBA(buttonTextColor, 100);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_buttonHoverBackgroundColor');
        if (TEMP) {
            const buttonHoverBackgroundColor = stringToBoolean(TEMP);
            globals.buttonHoverBackgroundColor = convertColorToRGBA(buttonHoverBackgroundColor, 100);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_buttonHoverTextColor');
        if (TEMP) {
            const buttonHoverTextColor = stringToBoolean(TEMP);
            globals.buttonHoverTextColor = convertColorToRGBA(buttonHoverTextColor, 100);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_singleConversation');
        if (TEMP) {
            globals.singleConversation = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_restartConversation');
        if (TEMP) {
            globals.restartConversation = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_nativeRating');
        if (TEMP) {
            globals.nativeRating = stringToBoolean(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_typingLocation');
        if (TEMP) {
            globals.typingLocation = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_showInfoMessage');
        if (TEMP) {
            globals.showInfoMessage = TEMP.split(',').map(key => { return key.trim()});
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_allowReopen');
        if (TEMP) {
            globals.allowReopen = stringToBoolean(TEMP);
            if(globals.allowReopen && !globals.showInfoMessage.includes('CHAT_CLOSED')){
                globals.showInfoMessage.push('CHAT_CLOSED')
            }
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_continueConversationBeforeTime');
        if (TEMP) {
            globals.continueConversationBeforeTime = +TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_participants');
        if (TEMP) {
            globals.participants = TEMP.split(',').map(key => { return key.trim()});
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_fileUploadAccept');
        if (TEMP) {
            globals.fileUploadAccept = TEMP;
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_disconnetTime');
        if (TEMP) {
            globals.disconnetTime = stringToNumber(TEMP);
        }

        TEMP = getParameterByName(windowContext, 'GPTMysite_hiddenMessage');
        if (TEMP) {
            globals.hiddenMessage = TEMP;
        }

    }

    /**
     * E: setVariableFromStorage
     * recupero il dictionary global dal local storage
     * aggiorno tutti i valori di globals
     * @param globals
     */
    setVariableFromStorage(globals: Globals) {
        this.logger.debug('[GLOBAL-SET] setVariableFromStorage :::::::: SET VARIABLE ---------->', Object.keys(globals));
        for (const key of Object.keys(globals)) {
            const val = this.appStorageService.getItem(key);
            // this.logger.debug('[GLOBAL-SET] setVariableFromStorage SET globals KEY ---------->', key);
            // this.logger.debug('[GLOBAL-SET] setVariableFromStorage SET globals VAL ---------->', val);
            if (val && val !== null) {
                // globals.setParameter(key, val);
                globals[key] = stringToBoolean(val);
            }
            // this.logger.debug('[GLOBAL-SET] setVariableFromStorage SET globals == ---------->', globals);
        }
    }

     // ========= begin:: GET DEPARTEMENTS ============//
    /**
     * INIT DEPARTMENT:
     * get departments list
     * set department default
     * CALL AUTHENTICATION
    */
    initDepartments(departments: any) {
        this.globals.setParameter('departmentSelected', null);
        this.globals.setParameter('departmentDefault', null);
        this.logger.info('[GLOBAL-SET] initDepartments departments ::::', departments);
        if (departments === null ) { return; }
        this.globals.departments = departments;
        if (departments.length === 1) {
            // UN SOLO DEPARTMENT
            this.logger.debug('[GLOBAL-SET] initDepartments DEPARTMENT FIRST ::::', departments[0]);
            this.globals.setParameter('departmentDefault', departments[0]);
            this.setDepartment(departments[0]);
            // return false;
        } else if (departments.length > 1) {
            // there are more then 1 department
            this.logger.debug('[GLOBAL-SET] initDepartments > MORE THAN 1 DEPARTMENT ::::', departments[0]);
            let i = 0;
            departments.forEach(department => {
                if (department['default'] === true) {
                    // this.globals.departmentDefault = department;
                    // console.log('this.globals.offline_msg ::::', department['offline_msg']);
                    // console.log('this.globals.online_msg ::::', department['online_msg']);
                    // departments.splice(i, 1);
                    this.globals.setParameter('departmentDefault', departments[i]);
                    this.setDepartment(departments[i]);
                    return;
                }
                i++;
            });
            // this.globals.setParameter('departmentDefault', departments[0]);
            // this.setDepartment(departments[0]);
        } else {
            // DEPARTMENT DEFAULT NON RESTITUISCE RISULTATI !!!!
            this.logger.error('[GLOBAL-SET] initDepartments > DEPARTMENT DEFAULT NON RESTITUISCE RISULTATI ::::');
            // return;
        }

        // this.setDepartmentFromExternal(); // chiamata ridondante viene fatta nel setParameters come ultima operazione
    }


    setDepartmentFromExternal() {
        // se esiste un departmentID impostato dall'esterno,
        // creo un department di default e lo imposto come department di default
        // this.logger.debug('[GLOBAL-SET] setDepartmentFromExternal > EXTERNAL departmentID ::::' + this.globals.departmentID);
        let isValidID = false;
        if (this.globals.departmentID) {
            this.globals.departments.forEach(department => {
                if (department._id === this.globals.departmentID) {
                    this.logger.debug('[GLOBAL-SET] setDepartmentFromExternal > EXTERNAL DEPARTMENT ::::' + department._id);
                    this.globals.setParameter('departmentDefault', department);
                    this.setDepartment(department);
                    isValidID = true;
                    return;
                }
            });
            if (isValidID === false) {
                // se l'id passato non corrisponde a nessun id dipartimento esistente viene annullato
                // per permettere di passare dalla modale dell scelta del dipartimento se necessario (+ di 1 dipartimento presente)
                this.globals.departmentID = null;
            }
            this.logger.debug('[GLOBAL-SET] setDepartmentFromExternal > END departmentID ::::' + this.globals.departmentID + isValidID);
        }
        //remove default department from list
        this.globals.departments = this.globals.departments.filter(obj => obj['default'] !== true)
        if(this.globals.departments && this.globals.departments.length === 1){
            this.setDepartment(this.globals.departments[0])
        }
    }

    /**
     * SET DEPARTMENT:
     * set department selected
     * save department selected in attributes
     * save attributes in this.appStorageService
    */
    setDepartment(department) {
        this.logger.debug('[GLOBAL-SET] setDepartment: ', JSON.stringify(department));
        this.globals.setParameter('departmentSelected', department);
        // let attributes = this.globals.attributes;
        let attributes: any = JSON.parse(this.appStorageService.getItem('attributes'));
        if (!attributes) {
            attributes = {
                departmentId: department._id,
                departmentName: department.name
            };
        } else {
            attributes.departmentId = department._id;
            attributes.departmentName = department.name;
        }

        // this.logger.debug('[GLOBAL-SET] setDepartment > department.online_msg: ', department.online_msg);
        // this.logger.debug('[GLOBAL-SET] setDepartment > department.offline_msg: ', department.offline_msg);
        this.logger.debug('[GLOBAL-SET] setDepartment > setAttributes: ', JSON.stringify(attributes));
        this.globals.setParameter('departmentSelected', department);
        this.globals.setParameter('attributes', attributes);
        // this.appStorageService.setItem('attributes', JSON.stringify(attributes));

    }
    // ========= end:: GET DEPARTEMENTS ============//


    // ========= begin:: GET AVAILABLE AGENTS STATUS ============//
    /** setAvailableAgentsStatus
     * verifica se c'è un'agent disponibile
     */
    private setAvailableAgentsStatus(availableAgents) {
        this.globals.setParameter('availableAgentsStatus', false);
        if ( availableAgents === null ) { return; }
        if (availableAgents.length > 0) {
            // this.globals.areAgentsAvailable = true;
            // this.globals.setParameter('areAgentsAvailable', true);
            // this.globals.setParameter('areAgentsAvailableText', this.globals.AGENT_AVAILABLE);
            const arrayAgents = [];
            availableAgents.forEach((element, index: number) => {
                element.imageurl = getImageUrlThumb(element.id);
                arrayAgents.push(element);
                if (index >= 4) { return; }
                // this.logger.debug('[GLOBAL-SET] setAvailableAgentsStatus > index, ' - element->', element);
            });

            // availableAgents.forEach(element => {
            //     element.imageurl = getImageUrlThumb(element.id);
            //     arrayAgents.push(element);
            // });
            // let limit = arrayAgents.length;
            // if (arrayAgents.length > 5) {
            //     limit = 5;
            // }
            this.globals.availableAgents = arrayAgents;
            this.globals.setParameter('availableAgentsStatus', true);
            // this.globals.setParameter('availableAgents', availableAgents);
            // this.logger.debug('[GLOBAL-SET] setAvailableAgentsStatus > element->', this.globals.availableAgents);
            // this.logger.debug('[GLOBAL-SET] setAvailableAgentsStatus > areAgentsAvailable->', this.globals.areAgentsAvailable);
            // this.logger.debug('[GLOBAL-SET] setAvailableAgentsStatus > areAgentsAvailableText->', this.globals.areAgentsAvailableText);
        }

    }
    // ========= end:: GET AVAILABLE AGENTS STATUS ============//


    getProjectParametersById(id: string): Observable<any[]> {
        if(id){
            const API_URL = this.appConfigService.getConfig().apiUrl;
            const url = API_URL + id + '/widgets';
            // console.log('getProjectParametersById: ', url);
            const headers = new HttpHeaders();
            headers.append('Content-Type', 'application/json');
            return this.http.get<any[]>(url, { headers })
        }
    }

}
