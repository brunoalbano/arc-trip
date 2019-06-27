import { Component, Prop, State, h } from '@stencil/core';
import { database } from '../../base/firebase';
import { Place, Task } from '../../base/interfaces';
import { waitForGoogleApi, mapFromGooglePlace, timespamToString } from '../../helpers/utils';
import firebase from 'firebase/app';
import 'firebase/firestore';

@Component({
  tag: 'app-place',
  styleUrl: 'app-place.css'
})
export class AppPlace {

  @Prop() placeId: string;

  @State() place: Place;

  get isPlaceAdded() {
    return !!this.place;
  }

  @State() isLoadingPlace: boolean = true;

  @State() googlePlace: google.maps.places.PlaceResult;

  isLoadingGooglePlace: boolean = true;

  @State() detailOpeningHours = false;

  componentWillLoad() {
    this.loadPlace();
    this.loadGooglePlace();
  }

  async updatePlace() {
    let place = {
      ...this.place,
      tasks: this.place.tasks.filter(t => !!t.description)
    };

    await database.places.set(place);
  }

  async loadPlace() {
    this.isLoadingPlace = true;
    this.place = await database.places.get(this.placeId);
    this.isLoadingPlace = false;

    if (this.isPlaceAdded)
      this.addEmptyTask();
  }

  async loadGooglePlace() {
    this.isLoadingGooglePlace = true;

    await waitForGoogleApi();
    let service = new google.maps.places.PlacesService(document.createElement('div'));

    service.getDetails({ placeId: this.placeId, fields: ['place_id', 'address_components', 'formatted_address', 'formatted_phone_number', 'name', 'opening_hours', 'photos'] }, r => {
      this.googlePlace = r;
      this.isLoadingGooglePlace = false;
    });
  }

  addEmptyTask() {
    if (!this.place.tasks)
      this.place.tasks = [];

    let emptyTask = {
      description: '',
      done: false
    };

    this.place = {
      ...this.place,
      tasks: [...this.place.tasks, emptyTask]
    };
  }

  handleTaskKeyDown(e: KeyboardEvent, task: Task) {
    let isLastTask = task == this.place.tasks[this.place.tasks.length - 1];

    if (isLastTask && e.key && e.key.length == 1 && e.key != ' ')
      this.addEmptyTask();
  }

  handleTaskDescriptionChange(e, task: Task) {
    task.description = e.target.value;

    this.updatePlace();
  }

  handleTaskDoneChange(e, task: Task) {
    task.done = e.target.checked;
    this.updatePlace();
  }

  handleVisitedChange(e) {
    this.place.visited = e.target.checked;
    this.updatePlace();
  }

  handleRemoveTaskClick(e: UIEvent, task: Task) {
    let target = e.target as HTMLElement;

    let sliding = target.closest('ion-item-sliding');

    sliding.close();

    this.place = {
      ...this.place,
      tasks: this.place.tasks.filter(t => t != task)
    };

    this.updatePlace();
  }

  handleScheduleChange(e) {
    let value = e.target.value as string;

    if (!value)
      this.place.schedule = null;
    else {
      let date = new Date(value);
      this.place.schedule = firebase.firestore.Timestamp.fromDate(date);
    }

    this.updatePlace();
  }

  addPlace() {
    let place = mapFromGooglePlace(this.googlePlace);

    database.places.add(place);

    this.place = place;

    this.addEmptyTask();
  }

  renderSpinner() {
    return (
      <div class="ion-text-center ion-padding"><ion-spinner name="dots"></ion-spinner></div>
    );
  }

  renderPlace() {
    if (!this.place)
      return;

    let schedule = this.place && timespamToString(this.place.schedule);

    return (
      <div>
        <ion-item lines="none">
          <ion-icon name="calendar" slot="start"></ion-icon>
          <ion-input value={schedule} type={"datetime-local" as any} placeholder="Data e hora de visita" onIonChange={e => this.handleScheduleChange(e)} clearInput></ion-input>
        </ion-item>
        <ion-item lines="none">
          <ion-checkbox name="pin" slot="start" checked={this.place.visited} onIonChange={e => this.handleVisitedChange(e)}></ion-checkbox>
          <ion-label>Visitado</ion-label>
        </ion-item>
      </div>
    );
  }

  renderGooglePlace() {
    if (!this.googlePlace)
      return;

    return (
      <div>
        <ion-item lines="none" href={`https://www.google.com/maps/search/?api=1&query=${this.googlePlace.formatted_address}&query_place_id=${this.googlePlace.place_id}`}>
          <ion-icon name="pin" slot="start"></ion-icon>
          <ion-label class="ion-text-wrap">{this.googlePlace.formatted_address}</ion-label>
        </ion-item>
        {
          this.googlePlace.formatted_phone_number &&
          <ion-item lines="none" href={`tel:${this.googlePlace.formatted_phone_number}`}>
            <ion-icon name="call" slot="start"></ion-icon>
            <ion-label class="ion-text-wrap">{this.googlePlace.formatted_phone_number}</ion-label>
          </ion-item>
        }
        {this.renderOpeningHours()}
      </div>
    );
  }

  renderOpeningHours() {
    if (!this.googlePlace || !this.googlePlace.opening_hours)
      return;

    let opening_hours = this.googlePlace.opening_hours;

    return [
      <ion-item lines="none" button detail={false} onClick={() => this.detailOpeningHours = !this.detailOpeningHours}>
        <ion-icon name="clock" slot="start"></ion-icon>
        <ion-label color={opening_hours.open_now ? 'success' : 'danger'}>
          <ion-text ></ion-text>
          {opening_hours.open_now ? 'Aberto' : 'Fechado'}
        </ion-label>
        <ion-button fill="clear" color="dark" slot="end">
          <ion-icon name={this.detailOpeningHours ? 'arrow-dropup' : 'arrow-dropdown'} mode="ios"></ion-icon>
        </ion-button>
      </ion-item>,

      this.detailOpeningHours && opening_hours.weekday_text && opening_hours.weekday_text.map(weekDay =>
        <ion-item lines="none">
          <ion-icon name="clock" slot="start" style={{ visibility: 'hidden' }}></ion-icon>
          <ion-label>
            <p>{weekDay}</p>
          </ion-label>
        </ion-item>
      )
    ]
  }

  renderTasks() {
    if (!this.place)
      return;

    return (
      <ion-list>
        <ion-list-header>Tarefas</ion-list-header>
        {this.place.tasks && this.place.tasks.map(task =>
          <ion-item-sliding disabled={!task.description}>
            <ion-item>
              <ion-checkbox checked={task.done} disabled={!task.description} slot="start" onIonChange={e => this.handleTaskDoneChange(e, task)}></ion-checkbox>
              <ion-input
                placeholder="Adicionar tarefa"
                value={task.description}
                onChange={e => this.handleTaskDescriptionChange(e, task)}
                onKeyDown={e => this.handleTaskKeyDown(e, task)}>
              </ion-input>
            </ion-item>

            <ion-item-options side="end">
              <ion-item-option color="danger" onClick={e => this.handleRemoveTaskClick(e, task)}>Remover</ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        )}
      </ion-list>
    );
  }

  renderSlider() {
    if (this.isLoadingGooglePlace)
      return (
        <div class={{ 't-slider-container': true, 't-loading': this.isLoadingGooglePlace }}>
          {this.renderSpinner()}
          <ion-back-button defaultHref="/" color="dark" />
        </div>
      );

    let placeDoesNotHasPhotos = !this.googlePlace.photos || !this.googlePlace.photos.length;

    if (placeDoesNotHasPhotos)
      return;

    return (
      <div class="t-slider-container">
        {
          <ion-slides pager={true}>
            {this.googlePlace.photos.map(photo =>
              <ion-slide>
                <img src={photo.getUrl({ maxWidth: 400, maxHeight: 400 })} />
              </ion-slide>
            )}
          </ion-slides>
        }
        <ion-back-button defaultHref="/" color="dark" />
      </div>
    )
  }

  renderAddButton() {
    if (this.isLoadingPlace || this.isLoadingGooglePlace || this.isPlaceAdded)
      return;

    return (
      <ion-button fill="outline" expand="block" onClick={() => this.addPlace()}>Adicionar ao roteiro</ion-button>
    );
  }

  render() {
    return [
      <ion-content>
        {this.renderSlider()}
        <h1 class="ion-padding-start ion-padding-end">{this.googlePlace && this.googlePlace.name}</h1>
        {this.renderPlace()}
        {this.renderGooglePlace()}
        {this.renderTasks()}
        {this.renderAddButton()}
        {this.isLoadingGooglePlace || this.isLoadingPlace ? this.renderSpinner() : null}
      </ion-content>
    ];
  }
}
