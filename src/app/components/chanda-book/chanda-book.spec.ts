import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChandaBook } from './chanda-book';

describe('ChandaBook', () => {
  let component: ChandaBook;
  let fixture: ComponentFixture<ChandaBook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChandaBook]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChandaBook);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
