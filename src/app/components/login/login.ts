import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../services/auth'; // Update path
import { inject } from '@angular/core';
  import { getErrorMessage } from '../../utils/error';
import { handleFirebaseError } from '../../utils/firebase-error';
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
  showPassword: boolean = false; // 👈 add this
  private auth = inject(Auth);
  private authService = inject(AuthService);

  ngOnInit(): void {}

  // async loginWithEmail() {
  //   try {
  //     await signInWithEmailAndPassword(this.auth, this.email, this.password);
  //     console.log('Email login successful');
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     alert('Invalid email or password');
  //   }
  // }

  // async signInWithGoogle() {
  //   console.log('Google sign-in button clicked');
  //   try {
  //     await this.authService.signInWithGoogle();
  //     console.log('Google sign-in completed');
  //   } catch (error) {
  //     console.error('Google login error:', error);
  //   }
  // }


async loginWithEmail() {
  try {
    await signInWithEmailAndPassword(this.auth, this.email, this.password);
  } catch (error) {
    const message = handleFirebaseError(error);
    console.error('Login error:', error);
    alert(message);
  }
}
// In your LoginComponent
async signInWithGoogle() {
  console.log('Google sign-in button clicked');
  try {
    await this.authService.signInWithGoogle();
    console.log('Google sign-in method completed');
  } catch (error) {
    console.error('Google login error in component:', error);
  }
}

// async signInWithGoogle() {
//   try {
//     await this.authService.signInWithGoogle();
//   } catch (error) {
//     const message = handleFirebaseError(error);
//     console.error('Google login error:', error);
//     alert(message);
//   }
// }
// async loginWithEmail() {
//   try {
//     await signInWithEmailAndPassword(this.auth, this.email, this.password);
//   } catch (error) {
//     const message = getErrorMessage(error);
//     console.error('Login error:', message);
//     alert('Invalid email or password');
//   }
// }

// async signInWithGoogle() {
//   try {
//     await this.authService.signInWithGoogle();
//   } catch (error) {
//     const message = getErrorMessage(error);
//     console.error('Google login error:', message);
//     alert('Google sign-in failed. Try again.');
//   }
// }
}
