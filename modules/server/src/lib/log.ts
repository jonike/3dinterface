import express = require('express');
import http = require('http');
import yargs = require('yargs');

var argv = yargs.argv;

module log {

export enum Color {
    DEFAULT,
    BLACK,
    RED,
    GREEN,
    YELLOW,
    BLUE,
    MAGENTA,
    CYAN,
    ORANGE,
}

function getColorCode(c : Color) : string {
    switch (c) {
        case Color.DEFAULT: return '\u001b[0m';
        case Color.BLACK:   return '\u001b[30m';
        case Color.RED:     return '\u001b[31m';
        case Color.GREEN:   return '\u001b[32m';
        case Color.YELLOW:  return '\u001b[33m';
        case Color.BLUE:    return '\u001b[34m';
        case Color.MAGENTA: return '\u001b[35m';
        case Color.CYAN:    return '\u001b[36m';
        case Color.ORANGE:  return '\u001b[38;5;202m';
    }
}

var isDev = require('express')().get('env') === 'development';

var write : (elt : any, color : Color) => void;

if (argv.nolisten || argv.n) {
    write = function(elt : any, color : Color) { }
} else if (isDev) {
    write = function(elt : any, color : Color) {
        console.log(getColorCode(color) + elt + getColorCode(Color.DEFAULT));
    }
} else {
    write = function(elt : any, color : Color) {
        console.log(elt);
    }
}

export function ready(msg : any) {
    write('[RDY] ' + new Date() + ' ' + msg, Color.GREEN);
}

export function request(req : express.Request, res : Express.Response, time : number) {

    if (req.headers['x-forwarded-for'] !== undefined || isDev) {

        var isStatic = req.url.substr(0, 7) === '/static' || req.url === '/favicon.ico';

        write(
            '[REQ] ' + new Date() + ' ' +
                (req.headers['x-forwarded-for'] || req.connection.remoteAddress) +
                (time !== undefined ? (' in ' + ("      " + time).slice(-6) + ' ms') : '') +
                ' : ' + (isStatic && req.url !== '/favicon.ico' ? '/static' + req.url : req.url),
            isStatic ? Color.YELLOW : Color.CYAN
        );
    }

}

export module socket {

    export function connection(socket : SocketIO.Socket) {
        write(
            '[SOK] ' + new Date() + ' ' +
                (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address) + ' connection',
            Color.MAGENTA
        );
    }

    export function disconnect(socket : SocketIO.Socket) {
        write(
            '[SOK] ' + new Date() + ' ' +
                (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address) + ' disconnect',
            Color.MAGENTA
        );
    }

}

export function dberror(error : any) {
    write(
        '[DBE] ' + new Date() + ' ' + error,
        Color.RED
    );
}

export function prefetcherror(error : any) {
    write(
        '[PFE] ' + new Date() + ' ' + error,
        Color.RED
    );
}

export function mailerror(error : any) {
    write(
        '[MLE] ' + new Date() + ' ' + error,
        Color.RED
    );
}

export function debug(info? : any, force? : boolean) {
    if (isDev || force === true) {
        write(
            '[DBG] ' + (info !== undefined ? info : ''),
            Color.YELLOW
        );
    }
}

export function jadeerror(error : any) {
    write(
        '[JER] ' + new Date() + ' ' + error,
        Color.RED
    );
}

export function warning(message : any) {

    write(
        '[WRN] ' + new Date() + ' ' + message,
        Color.ORANGE
    );

}

export function faceerror(message : any) {

    write(
        '[FER] ' + new Date() + ' ' + message,
        Color.RED
    );

}

}

export = log;
