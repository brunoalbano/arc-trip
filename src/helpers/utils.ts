import { Place } from "../base/interfaces";


export function sayHello() {
  return Math.random() < 0.5 ? 'Hello' : 'Hola';
}

export function waitForGoogleApi() {
  let wait = (resolve) => {
    if (google)
      resolve();

    setTimeout(() => wait(resolve), 50);
  };

  return new Promise((resolve) => {
    wait(resolve);
  });
}

export function mapFromGooglePlace(place: google.maps.places.PlaceResult): Place {
  return {
    placeId: place.place_id,
    name: place.name,
    schedule: null,
    shortAddress: generateShortAdress(place),
    tasks: [],
    visited: false
  };
}

function generateShortAdress(place: google.maps.places.PlaceResult) {
  let result = "";

  for (let component of place.address_components) {
    if (component.types.indexOf('locality') >= 0
      || component.types.indexOf('administrative_area_level_1') >= 0
      || component.types.indexOf('administrative_area_level_2') >= 0
      || component.types.indexOf('administrative_area_level_3') >= 0) {
      if (result) {
        if (component.types.indexOf('country'))
          result += ', ';
        else
          result += ' - ';
      }

      result += component.short_name;
    }
  }

  return result || place.formatted_address;
}

export function timespamToString(date: any): string {
  let convert = (date) => {
    if (!date)
      return null;

    if (date.toDate)
      return convert(date.toDate());

    if (date.toLocaleTimeString) {
      let d = date as Date;

      let year = d.getFullYear();
      let month = date.toLocaleString('pt-BR', { month: '2-digit' });
      let day = d.toLocaleString('pt-BR', { day: '2-digit' });
      let time = d.toLocaleTimeString();

      let t = `${year}-${month}-${day}T${time}`;
      
      return t;
    }

    return date || null;
  };

  return convert(date);
}