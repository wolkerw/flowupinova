
"use client";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

export interface Contact {
    id?: string;
    name: string;
    email: string;
    phone: string;
}

// Helper to get the collection reference for a specific user's contacts
function getContactsCollectionRef(userId: string) {
    return collection(db, `users/${userId}/contacts`);
}

/**
 * Adds a new contact to a user's contact list in Firestore.
 * @param userId The UID of the user.
 * @param contactData The contact data to add.
 */
export async function addContact(userId: string, contactData: Omit<Contact, 'id'>): Promise<void> {
    if (!userId) {
        throw new Error("UserID é necessário para adicionar um contato.");
    }
    if (!contactData.name || !contactData.email) {
        throw new Error("Nome e e-mail são campos obrigatórios.");
    }

    try {
        const contactsCollection = getContactsCollectionRef(userId);
        await addDoc(contactsCollection, {
            ...contactData,
            createdAt: new Date(), // Add a timestamp for ordering
        });
        console.log(`Contato adicionado com sucesso para o usuário ${userId}.`);
    } catch (error: any) {
        console.error(`Erro ao adicionar contato para o usuário ${userId}:`, error);
        throw new Error("Não foi possível adicionar o contato ao banco de dados.");
    }
}

/**
 * Retrieves all contacts for a specific user from Firestore.
 * @param userId The UID of the user.
 * @returns An array of contacts.
 */
export async function getContacts(userId: string): Promise<Contact[]> {
    if (!userId) {
        console.error("UserID é necessário para buscar contatos.");
        return [];
    }

    try {
        const contactsCollection = getContactsCollectionRef(userId);
        const q = query(contactsCollection, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const contacts: Contact[] = [];
        querySnapshot.forEach((doc) => {
            contacts.push({ id: doc.id, ...doc.data() } as Contact);
        });

        return contacts;
    } catch (error: any) {
        console.error(`Erro ao buscar contatos para o usuário ${userId}:`, error);
        throw new Error("Não foi possível buscar os contatos do banco de dados.");
    }
}

    