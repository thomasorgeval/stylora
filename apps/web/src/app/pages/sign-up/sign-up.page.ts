import { CommonModule } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from 'ngx-better-auth'
import { firstValueFrom } from 'rxjs'

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return 'Unable to create your account right now. Please try again.'
}

function buildUsername(email: string) {
  return (email.split('@')[0] ?? 'user').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 32) || 'user'
}

@Component({
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: 'sign-up.page.html',
})
export class SignUpPage {
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  protected name = ''
  protected email = ''
  protected password = ''
  protected readonly isSubmitting = signal(false)
  protected readonly errorMessage = signal('')

  protected async signUp() {
    if (this.isSubmitting()) {
      return
    }

    this.errorMessage.set('')
    this.isSubmitting.set(true)

    try {
      await firstValueFrom(
        this.authService.signUpEmail({
          name: this.name.trim(),
          email: this.email.trim(),
          password: this.password,
          username: buildUsername(this.email.trim()),
        }),
      )

      await this.router.navigateByUrl('/projects')
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error))
    } finally {
      this.isSubmitting.set(false)
    }
  }
}
