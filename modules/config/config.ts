module config {

    export enum Scene {
        PeachCastle,
        BobombBattlefield,
        CoolCoolMountain,
        WhompFortress,
        Sponza
    }

    export enum RecommendationStyle {
        BaseRecommendation,
        ViewportRecommendation,
        ArrowRecommendation
    }

    export interface CoinConfig {

        /** If we should see the coins at the beginning */
        visible ?: boolean;

        /** Type of config */
        type : ConfigType;

        /** If type == ConfigType.SOME, the ids of the coins to add */
        ids ?: number[];

    }

    export enum ConfigType {

        None,
        Some,
        All

    }

    export enum PrefetchingPolicy {
        NV_PN,
        V_PP,
        V_PD,
        V_PP_PD
    }

    export interface ExpConfig {

        scene : Scene;

        coinConfig ?: CoinConfig;

        recommendationStyle : RecommendationStyle;

    }

    export interface LoadingConfig {

        prefetchingPolicy : PrefetchingPolicy;
        lowRes ?: boolean;

    }

}

export = config;
