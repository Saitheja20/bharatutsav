import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../services/auth'; // Update path
import { inject } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';

  private auth = inject(Auth);
  private authService = inject(AuthService);

  ngOnInit(): void {}

  async loginWithEmail() {
    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      // AuthService will handle navigation automatically via onAuthStateChanged
    } catch (error) {
      console.error('Login error:', error);
      alert('Invalid email or password');
    }
  }

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      // AuthService handles navigation automatically
    } catch (error) {
      console.error('Google login error:', error);
      alert('Google sign-in failed. Try again.');
    }
  }
}
