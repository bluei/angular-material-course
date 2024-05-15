import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Course } from "../model/course";
import { CoursesService } from "../services/courses.service";
import { debounceTime, distinctUntilChanged, startWith, tap, delay, catchError, finalize } from 'rxjs/operators';
import { merge, fromEvent, throwError } from "rxjs";
import { Lesson } from '../model/lesson';
import { SelectionModel } from '@angular/cdk/collections';


@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss']
})
export class CourseComponent implements OnInit, AfterViewInit {

  coursesService = inject(CoursesService);
  route = inject(ActivatedRoute);

  course: Course;
  lessons: Lesson[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  selection = new SelectionModel<Lesson>(true, []);

  constructor() {
  }

  displayedColumns = ['select', 'seqNo', 'description', 'duration'];
  expandedLesson: Lesson = null;

  ngOnInit() {
    this.course = this.route.snapshot.data["course"];
    this.loadLessonsPage();
  }

  loadLessonsPage() {
    // turn on the loading indicator
    this.loading = true;

    this.coursesService.findLessons(
          this.course.id, 
          this.sort?.direction ?? "asc", 
          this.paginator?.pageIndex ?? 0, 
          this.paginator?.pageSize ?? 3,
          this.sort?.active ?? "seqNo")
      .pipe(
        tap(lessons => {
          this.lessons = lessons;
          this.selection.clear(); // added in order to fix selections if page size changes
        }),
        catchError(err => {
          console.log("Error Loading Lessons.", err);
          alert("Error Loading Lessons.");
          return throwError(err);
        }),
        // no matter what happens, error or succeed, turn off the loading indicator
        finalize(() => {
          this.loading = false;
         } )
      )
      .subscribe();
  }

  ngAfterViewInit() {
    // if the sort order changes, reset page to the first page of results
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    // merge combines both observables so when either changes, we pipe to the code below.
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        tap(() => this.loadLessonsPage())
      )
      .subscribe();
  }

  onToggleLesson(lesson: Lesson) {
    if (lesson == this.expandedLesson) {
      this.expandedLesson = null;
    } else {
      this.expandedLesson = lesson;
    }
  }

  onLessonToggled(lesson: Lesson) {
    this.selection.toggle(lesson);
  }

  isAllSelected() {
    return this.selection.hasValue() && (this.selection.selected?.length == this.lessons?.length)
  }

  toggleAll() {

    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.lessons);
    }
  }

}
