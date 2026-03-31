import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

import {Provider} from "react-redux"
import {store} from "./redux/store"
import reportWebVitals from './reportWebVitals'

import { SettingsProvider } from './context/SettingsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <SettingsProvider>
                <App />
            </SettingsProvider>
        </Provider>
    </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);