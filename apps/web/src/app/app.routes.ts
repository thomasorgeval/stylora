import type { Routes } from '@angular/router'
import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from 'ngx-better-auth'
import { SignInPage } from './pages/sign-in/sign-in.page'
import { SignUpPage } from './pages/sign-up/sign-up.page'
import { WorkspacePage } from './pages/workspace/workspace.page'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },
  {
    path: 'sign-in',
    component: SignInPage,
    ...canActivate(redirectLoggedInTo(['/projects'])),
  },
  {
    path: 'sign-up',
    component: SignUpPage,
    ...canActivate(redirectLoggedInTo(['/projects'])),
  },
  {
    path: 'projects',
    component: WorkspacePage,
    ...canActivate(redirectUnauthorizedTo(['/sign-in'])),
  },
  {
    path: '**',
    redirectTo: 'sign-in',
  },
]
