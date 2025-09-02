import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Members } from './members';

describe('Members', () => {
  let component: Members;
  let fixture: ComponentFixture<Members>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Members]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Members);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
