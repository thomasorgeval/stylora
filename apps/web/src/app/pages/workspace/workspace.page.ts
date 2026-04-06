import { Component, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from 'ngx-better-auth'
import { firstValueFrom } from 'rxjs'

@Component({
  templateUrl: 'workspace.page.html',
})
export class WorkspacePage {
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  protected readonly isSigningOut = signal(false)
  protected readonly userName = computed(() => this.authService.session()?.user.name ?? 'Unknown user')
  protected readonly userEmail = computed(() => this.authService.session()?.user.email ?? 'No email')

  protected async signOut() {
    if (this.isSigningOut()) {
      return
    }

    this.isSigningOut.set(true)

    try {
      await firstValueFrom(this.authService.signOut())
      await this.router.navigateByUrl('/sign-in')
    } finally {
      this.isSigningOut.set(false)
    }
  }
}
