import { Component } from '@angular/core';
import { PomodoroTimer } from './components/pomodoro-timer/pomodoro-timer';

@Component({
  selector: 'app-root',
  imports: [PomodoroTimer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
