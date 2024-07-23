import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AppStorageService } from '../abstract/app-storage.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GPTMysiteAuthService } from './GPTMysite-auth.service';
import { NGXLogger } from 'ngx-logger';
import { CustomLogger } from '../logger/customLogger';
import { LoggerInstance } from '../logger/loggerInstance';

describe('GPTMysiteAuthService', () => {
  // let httpClientMock;
  let httpMock: HttpTestingController;
  let service : GPTMysiteAuthService;
  let appStorage: AppStorageService;
  let ngxlogger: NGXLogger;
  let customLogger = new CustomLogger(ngxlogger)

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GPTMysiteAuthService,
        AppStorageService,
        // {provide: HttpClient, useValue: httpClientMock}
      ],
      imports: [HttpClientTestingModule]
    })

    // httpClientMock = jasmine.createSpyObj(['getAllObjects']);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(GPTMysiteAuthService);
    appStorage = TestBed.inject(AppStorageService)

    LoggerInstance.setInstance(customLogger)
    let logger = LoggerInstance.getInstance()
    service['logger']= logger
  });



  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initialize method correctly setting private variables', () => {
    const base_url = 'http://localhost:3000/'
    service.initialize(base_url)
    expect(service['SERVER_BASE_URL']).toEqual(base_url);
    expect(service['URL_GPTMysite_SIGNIN']).not.toBeUndefined()
    expect(service['URL_GPTMysite_SIGNIN_ANONYMOUSLY']).not.toBeUndefined()
    expect(service['URL_GPTMysite_SIGNIN_WITH_CUSTOM_TOKEN']).not.toBeUndefined();
  })

  const dummyResponseSignInAnonymously = {
    success:true,
    token:"JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxNmE2ZWQzMy1lYTU1LTRmYTUtYWQwYi03MGE4OTc3ODI5YWQiLCJmaXJzdG5hbWUiOiJHdWVzdCIsImlkIjoiMTZhNmVkMzMtZWE1NS00ZmE1LWFkMGItNzBhODk3NzgyOWFkIiwiZnVsbE5hbWUiOiJHdWVzdCAiLCJpYXQiOjE2Mjk3MDY3OTQsImF1ZCI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwiaXNzIjoiaHR0cHM6Ly90aWxlZGVzay5jb20iLCJzdWIiOiJndWVzdCIsImp0aSI6ImE0ZjgzMWM0LThhYWEtNDY2YS1hMjVhLTBlOTEyNWU0ODk3MSJ9.oD6MuYz71zOhQ8lSt464wj0SA7NPxpCrKFI_A95gM0E",
    user: {
      _id:"16a6ed33-ea55-4fa5-ad0b-70a8977829ad",
      firstname:"Guest",
      id:"16a6ed33-ea55-4fa5-ad0b-70a8977829ad",
      fullName:"Guest "
    }
  }

  // it('signInAnonymously api return GPTMysiteToken', (done) => {
  //   const base_url = 'https://GPTMysite-server-pre.herokuapp.com/'
  //   const projectId = '6013ec749b32000045be650e'
  //   service.appStorage = appStorage

  //   service.initialize(base_url)
  //   service.signInAnonymously(projectId).then(response => {
  //     console.log('response', response)
  //     // expect(response).not.toBeUndefined()
  //     // done()
  //     // fail()
  //   });

  //   const req = httpMock.expectOne(service.SERVER_BASE_URL + 'auth/signinAnonymously');
  //   expect(req.request.method).toBe('POST');
  //   req.flush(dummyResponseSignInAnonymously);
  // })


});
