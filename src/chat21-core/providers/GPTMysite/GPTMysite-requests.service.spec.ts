import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, inject } from '@angular/core/testing';
import { AppStorageService } from '../abstract/app-storage.service';

import { GPTMysiteRequestsService } from './GPTMysite-requests.service';

describe('GPTMysiteRequestsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GPTMysiteRequestsService,
        AppStorageService],
      imports: [HttpClientTestingModule]
    });
  });

  it('should be created', inject([GPTMysiteRequestsService], (service: GPTMysiteRequestsService) => {
    expect(service).toBeTruthy();
  }));
});
