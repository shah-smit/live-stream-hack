import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LiveMultiVideoComponent } from './live-multi-video/live-multi-video.component';
import { HomeComponent } from "./home-component/home-component.component";

const routes: Routes = [
  { path: "", component: HomeComponent },  
  { path: 'livestream/:id', component: LiveMultiVideoComponent },
  { path: "**", redirectTo: "" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }

export const routedComponents = [LiveMultiVideoComponent,HomeComponent];