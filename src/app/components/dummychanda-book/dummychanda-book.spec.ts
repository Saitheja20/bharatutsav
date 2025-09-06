import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DummychandaBook } from './dummychanda-book';

describe('DummychandaBook', () => {
  let component: DummychandaBook;
  let fixture: ComponentFixture<DummychandaBook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DummychandaBook]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DummychandaBook);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
