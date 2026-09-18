import { Component, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PomodoroSettings } from '../../models/pomodoro-settings.model';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

@Component({
  selector: 'app-pomodoro-timer',
  imports: [ReactiveFormsModule],
  templateUrl: './pomodoro-timer.html',
  styleUrl: './pomodoro-timer.css',
})
export class PomodoroTimer {
  // Form con le durate delle tre sessioni.
  settingsForm = new FormGroup({
    workMinutes: new FormControl(25, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),

    shortBreakMinutes: new FormControl(5, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),

    longBreakMinutes: new FormControl(15, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  // Tipo di sessione corrente.
  sessionType = signal<SessionType>('work');

  // Tempo rimanente espresso in sec.
  timeLeft = signal(25 * 60);

  // Indica se il timer è in esecuzione.
  isRunning = signal(false);

  // Numero di sessioni di lavoro completate.
  completedWorkSessions = signal(0);

  // Salvo il riferimento del timer.
  private timerId: number | null = null;

  // Trasformo i secondi nel formato minuti:sec.
  formattedTime = computed(() => {
    const minutes = Math.floor(this.timeLeft() / 60);
    const seconds = this.timeLeft() % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  // Mostro il nome della sessione corrente.
  sessionLabel = computed(() => {
    switch (this.sessionType()) {
      case 'shortBreak':
        return 'Short Break';

      case 'longBreak':
        return 'Long Break';

      default:
        return 'Work';
    }
  });

  // Applico le nuove impostazioni alla sessione corrente.
  applySettings() {
    if (this.settingsForm.invalid || this.isRunning()) {
      return;
    }

    const settings = this.getSettings();

    switch (this.sessionType()) {
      case 'shortBreak':
        this.timeLeft.set(settings.shortBreakMinutes * 60);
        break;

      case 'longBreak':
        this.timeLeft.set(settings.longBreakMinutes * 60);
        break;

      default:
        this.timeLeft.set(settings.workMinutes * 60);
    }
  }

  // Avvio o riprendo il timer.
  startTimer() {
    if (this.isRunning() || this.settingsForm.invalid) {
      return;
    }

    this.isRunning.set(true);

    // Disabilito le impostazioni mentre il timer è in esecuzione.
    this.settingsForm.disable();

    this.timerId = window.setInterval(() => {
      const currentTime = this.timeLeft();

      if (currentTime <= 1) {
        this.timeLeft.set(0);
        this.finishSession();
        return;
      }

      this.timeLeft.set(currentTime - 1);
    }, 1000);
  }

  // Fermo il timer.
  stopTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    this.isRunning.set(false);

    // Riabilito le impostazioni quando il timer è fermo.
    this.settingsForm.enable();
  }

  // Gestisco la fine della sessione.
  private finishSession() {
    this.stopTimer();

    const settings = this.getSettings();

    if (this.sessionType() === 'work') {
      const completedSessions = this.completedWorkSessions() + 1;

      this.completedWorkSessions.set(completedSessions);

      // Ogni quattro sessioni di lavoro passo a una pausa lunga.
      if (completedSessions % 4 === 0) {
        this.changeSession('longBreak', settings.longBreakMinutes);
      } else {
        this.changeSession('shortBreak', settings.shortBreakMinutes);
      }
    } else {
      // Dopo una pausa torno alla sessione di lavoro.
      this.changeSession('work', settings.workMinutes);
    }
  }

  // Cambio il tipo di sessione e imposto la sua durata.
  private changeSession(type: SessionType, minutes: number) {
    this.sessionType.set(type);
    this.timeLeft.set(minutes * 60);
  }

  // Recupero i valori presenti nel form.
  private getSettings(): PomodoroSettings {
    return this.settingsForm.getRawValue();
  }
}
