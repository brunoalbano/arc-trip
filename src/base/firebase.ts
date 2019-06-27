import firebase from 'firebase/app';
import 'firebase/firestore';
import { collectionData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
import { Place } from './interfaces';

const app = firebase.initializeApp({
    apiKey: 'AIzaSyCNmcR2zAX9C8nQsgWHgKwVQrd7qGVQths',
    //authDomain: '### FIREBASE AUTH DOMAIN ###',
    projectId: 'arc-trip'
});

firebase.firestore().enablePersistence();

class Repository<TItem> {
    private ref: firebase.firestore.CollectionReference;

    constructor(collectionName: string, private fieldId: keyof TItem) {
        this.ref = app.firestore().collection(collectionName);
    }

    list(): Observable<TItem[]> {
        return collectionData(this.ref, this.fieldId as string);
    }

    set(item: TItem) {
        let id = item[this.fieldId as any] as string;
        return this.ref.doc(id).set(item);
    }

    add(item: TItem) {
        let id = item[this.fieldId as any] as string;
        
        if (id)
            return this.ref.doc(id).set(item);
        else
            return this.ref.add(item);
    }

    async get(id: string) {
        let snap = await this.ref.doc(id).get();
        return snap.data() as Place;
    }
}

export const database = {
    places: new Repository<Place>('places', 'placeId')
};
