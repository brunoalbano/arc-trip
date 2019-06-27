import { Component, h, State } from '@stencil/core';
import { database } from '../../base/firebase';
import { Subscription } from 'rxjs';
import { Place } from '../../base/interfaces';
import { HTMLStencilElement } from '@ionic/core/dist/types/stencil.core';
import { waitForGoogleApi } from '../../helpers/utils';

interface Item { 
  month: string, 
  places: Place[] 
}

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css'
})
export class AppHome {
  @State() state: Item[];

  @State() host: HTMLStencilElement;

  searchbar: HTMLIonSearchbarElement;

  input: HTMLInputElement;

  _placesSub: Subscription;

  componentWillLoad() {
    this._placesSub = database.places.list().subscribe(places => {
      this.state = this.mapPlaces(places);
    });
  }

  mapPlaces(places:Place[]){
    places = places.sort((a, b) => a.schedule && b.schedule && a.schedule.seconds - b.schedule.seconds);

    let result : Item[] = [];

    for (let place of places) {
      let date = place.schedule && place.schedule.toDate();
      let month = date && date.toLocaleString('pt-BR', { month: 'long' })||'';

      let resultMonth = result.find(r => r.month == month);

      if (!resultMonth) {
        resultMonth = { month, places: [] };

        result.push(resultMonth);
      }

      resultMonth.places.push(place);
    } 

    return result;
  }

  componentDidUnload() {
    this._placesSub.unsubscribe();
  }

  componentDidLoad() {
    this.initSearchbar();
  }

  async initSearchbar() {
    await waitForGoogleApi();
    await this.searchbar.componentOnReady();

    let input = await this.searchbar.getInputElement();

    let autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.setFields(['place_id', 'name']);

    autocomplete.addListener('place_changed', () => {
      let place = autocomplete.getPlace();
      this.searchbar.value = "";
      this.openPlace(place.place_id);
    });
  }

  async openPlace(placeId: string) {
    let nav = document.querySelector('ion-nav');
    await nav.componentOnReady();
    await nav.push('app-place', { placeId });
  }

  async handlePlaceClick(e: UIEvent, place: Place) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();

    this.openPlace(place.placeId);
  }

  renderPlace(place: Place) {
    let date = place.schedule && place.schedule.toDate();
    let day = date && date.toLocaleString('pt-BR', { day: '2-digit' });    
    let hour = date && date.toLocaleString('pt-BR', { hour: '2-digit' });
    let minute = date && date.toLocaleString('pt-BR', { minute: '2-digit' });
    let week = date && date.toLocaleString('pt-BR', { weekday: 'short' });

    return (
      <ion-item button class={{ 't-visited': place.visited }} onClick={(e) => this.handlePlaceClick(e, place)}>
        <ion-avatar slot="start" class="t-icon">
            <span class="t-icon-day">{day}</span>
            <span class="t-icon-month">{week}</span>
        </ion-avatar>
        <ion-label>
          <h2>{place.name}</h2>
          <p>
          {date && (hour != '00' || minute != '00') && <span class="t-time">{hour}:{minute}</span>} 
          <span>{place.shortAddress}</span>
          </p>          
        </ion-label>
      </ion-item>
    );
  }

  renderPlaces() {
    if (!this.state || !this.state.length)
      return (<p class="ion-text-center">Nenhum local cadastrado</p>);

    return (
      <ion-list lines="none">
        {
          this.state.map(item => [
            item.month && <ion-item-divider sticky>{item.month}</ion-item-divider>,
            item.places.map(place => this.renderPlace(place))
          ])
        }
      </ion-list>
    );
  }

  renderSpinner() {
    return (
      <p class="ion-text-center"><ion-spinner name="dots"></ion-spinner></p>
    );
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-searchbar ref={e => this.searchbar = e as any} placeholder="Pesquisar por um local"></ion-searchbar>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        {this.state ? this.renderPlaces() : this.renderSpinner()}
      </ion-content>
    ];
  }
}
