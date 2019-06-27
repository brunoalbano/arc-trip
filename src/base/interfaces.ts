import firebase from 'firebase/app';

export interface Place {
    placeId: string;
    name: string;
    visited: boolean;
    shortAddress: string;
    tasks: Task[];
    schedule?: firebase.firestore.Timestamp;
}

export interface Task {
    description: string;
    done: boolean;
}
