import express = require('express');
import * as config from 'config';

export function demoConfig(req : express.Request, res : express.Response, render : Function) {

    res.setHeader('Content-Type', 'text/html');
    render('demo-config.jade');

};

export function demo(req : express.Request, res : express.Response, render : Function) {

    res.setHeader('Content-Type', 'text/html');

    let scene : config.Scene;
    let recommendationStyle : config.RecommendationStyle;
    let coinConfig : config.CoinConfig = {
        type : config.ConfigType.None
    };

    switch (req.query.scene) {
        case '2': scene = config.Scene.BobombBattlefield; break;
        case '3': scene = config.Scene.CoolCoolMountain;  break;
        case '4': scene = config.Scene.WhompFortress;     break;
    }

    switch (req.query.bookmark) {
        case '0': recommendationStyle = config.RecommendationStyle.BaseRecommendation;     break;
        case '1': recommendationStyle = config.RecommendationStyle.ViewportRecommendation; break;
        case '2': recommendationStyle = config.RecommendationStyle.ArrowRecommendation;    break;
    }

    res.locals.prefetch = req.query.prefetch;

    let conf : config.ExpConfig = {
        scene: scene,
        coinConfig: coinConfig,
        recommendationStyle: recommendationStyle
    };

    res.locals.config = JSON.stringify(conf);

    render('demo.jade');
};

