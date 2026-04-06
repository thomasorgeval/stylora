import { CommonModule } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { AuthService } from 'ngx-better-auth'
import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { PasswordModule } from 'primeng/password'
import { firstValueFrom } from 'rxjs'

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return 'Unable to sign in right now. Please try again.'
}

@Component({
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: 'sign-in.page.html',
})
export class SignInPage {
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  protected email = ''
  protected password = ''
  protected readonly isSubmitting = signal(false)
  protected readonly errorMessage = signal('')

  protected async signIn() {
    if (this.isSubmitting()) {
      return
    }

    this.errorMessage.set('')
    this.isSubmitting.set(true)

    try {
      await firstValueFrom(
        this.authService.signInEmail({
          email: this.email.trim(),
          password: this.password,
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
