// Copyright (c) 2015-présent Mattermost, Inc. Tous droits réservés.
// Voir LICENSE.txt pour les informations de licence.

import express from 'express';

// Shim pour l'accès à la récupération globale mattermost-redux
global.fetch = require('node-fetch');

import {AppBinding, AppCallRequest, AppCallResponse, AppForm, AppManifest} from '@mattermost/types/lib/apps';
import {Post} from '@mattermost/types/lib/posts';
import {Channel} from '@mattermost/types/lib/channels';

import {Client4} from '@mattermost/client';
import { type } from 'os';

const host = process.env.APP_HOST || 'localhost';
const port = process.env.APP_PORT || 5000;

const app = express();
app.use(express.json());

// Décommentez ces lignes pour activer le débogage détaillé des requêtes et des réponses
// importe l'enregistreur depuis './middleware/logger' ;
// app.use(enregistreur);

app.use((req, res, next) => {
    const call: AppCallRequest = req.body;
    // Ceci est utilisé pour interagir avec le serveur Mattermost dans l'environnement de développement docker-compose.
    // Nous ignorons l'URL du site envoyée dans les demandes d'appel et utilisons à la place l'URL du site connue de la variable d'environnement.    if (call?.context?.mattermost_site_url && process.env.MATTERMOST_SITEURL) {
        if (call?.context?.mattermost_site_url && process.env.MATTERMOST_SITEURL) {
            call.context.mattermost_site_url = process.env.MATTERMOST_SITEURL;
        }
    
        next();
    });
// Les moyens de log et le nom du bot
const manifest = {
    app_id: 'Essaie',
    display_name: "Test",
    description: "Example TypeScript app for Mattermost",
    homepage_url: 'https://github.com/Killian666/Test-Bot/tree/main/typescript/Test',
    app_type: 'http',
    icon: 'test.png',
    http: {
        root_url: `http://${host}:${port}`,
    },
    requested_permissions: [
        'act_as_bot',
    ],
    requested_locations: [
        '/channel_header',
        '/command',
    ],
} as AppManifest;
//Formulaire de saisie de score
const form: AppForm = {
    title: "Formulaire de saisie de score :)",
    icon: '../static/test.png',
    fields: [
        {
            "name": "J1E1",
            "label": "Joueur1/Equipe1:",
            "type": "text",
            "is_required": true,
            "position": 1
        },
        {
            "name": "J2E1",
            "label": "Joueur2/Equipe1:",
            "type": "user",
            "position": 2
        },
        {
            "name": "J1E2",
            "label": "Joueur1/Equipe2:",
            "type": "user",  
            "is_required": true,
            "position": 3
        },
        {
            "name": "J2E2",
            "label": "Joueur2/Equipe2:",
            "type": "user",
            "position": 4
        },
        {
            "name": "SE1",
            "label": "Score/Equipe1:",
            "type": "text",
            "subtype": "number",
            "is_required": true,
            "position":5
            
        },
        {
            "name": "SE2",
            "label": "Score/Equipe2:",
            "type": "text",
            "subtype": "number",
            "is_required": true,
            "position":6
            
        },
    ],
    submit: {
        path: '/submit',
        expand: {
            acting_user: "all",
            acting_user_access_token: "all"
        }
    },
};

const channelHeaderBindings = {
    location: '/channel_header',
    bindings: [
        {
            location: 'send-button',
            icon: 'test.png',
            label: 'Envoie un message avec le Test',
            form,
        },
    ],
} as AppBinding;

const commandBindings = {
    location: '/command',
    bindings: [
        {
            icon: 'test.png',
            label: 'essaie',
            description: manifest.description,
            hint: '[essaie]',
            bindings: [
                {
                    location: 'Test',
                    label: 'Test',
                    form,
                },
            ],
        },
    ],
} as AppBinding;

const commandBindings1 = {
    location: '/command',
    bindings: [
        {
            icon: 'test.png',
            label: 'form',
            description: manifest.description,
            hint: '[Formulaire]',
            bindings: [
                {
                    location: 'Saisie-de-joueur',
                    label: 'Saisie-de-joueur',
                    form,
                },
            ],
        },
    ],
} as AppBinding;

// Serve resources from the static folder
app.use('/static', express.static('./static'));

app.get('/manifest.json', (req, res) => {
    res.json(manifest);
});

//Déclaration de function pour les nouvelle commandes
app.post('/bindings', (req, res) => {
    const callResponse: AppCallResponse<AppBinding[]> = {
        type: 'ok',
        data: [
            channelHeaderBindings,
            commandBindings,
            commandBindings1,
        ],
    };

    res.json(callResponse);
});

type User = {
    label: string;
    type : string;
    value: string;
    name:string
}
type FormValues = {
    J1E1: User;
    J2E1: User;
    J1E2: User;
    J2E2: User;
    SE1: number;
    SE2: number;
}

function isWinner(score1: number, score2: number): string {
    if (score1 > score2)
        return 'Victoire de l équipe 1🏆'
    else if (score2 > score1)
        return 'Victoire de l équipe 2🏆'
    else
        return 'égalité 🐐'
}

app.post('/submit', async (req, res) => {
    const call = req.body as AppCallRequest;

    const botClient = new Client4();
    botClient.setUrl(call.context.mattermost_site_url);
    botClient.setToken(call.context.bot_access_token);
    
    const formValues = call.values as FormValues;
    // Message automatique -- le If permet de mettre un suite contextuelle (genre signature)
    let message = "L'équipe 1:" + formValues.J1E1 + ' & ' + formValues.J2E1 + ' avec un score de :' + formValues.SE1 + '😁' + "<--> l'équipe 2:" + formValues.J2E1 + ' & ' + formValues.J2E2 + ' avec un score de :' + formValues.SE2 + '🙃'+ '  Le score final est :  ' + isWinner(formValues.SE1, formValues.SE2);
    console.log(message)
//     message = `|Joueur|dvd|
// |---|--|
// |Joueur|dvd|
// |Joueur|dvd|`

    const users = [
        call.context.bot_user_id,
        call.context.acting_user.id,
    ] as string[];

    let channel: Channel;
    try {
        channel = await botClient.createDirectChannel(users);
    } catch (e: any) {
        res.json({
            type: 'error',
            error: 'Failed to create/fetch DM channel: ' + e.message,
        });
        return;
    }

    const post = {
        channel_id: channel.id,
        message,
    } as Post;

    try {
        await botClient.createPost(post)
    } catch (e: any) {
        res.json({
            type: 'error',
            error: 'Failed to create post in DM channel: ' + e.message,
        });
        return;
    }

    const callResponse: AppCallResponse = {
        type: 'ok',
        text: 'Created a post in your DM channel.',
    };

    res.json(callResponse);
});

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});

