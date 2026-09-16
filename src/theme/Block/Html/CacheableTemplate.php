<?php

declare(strict_types=1);

namespace Satoshi\Theme\Block\Html;

use Magento\Framework\View\Element\Template;
use Magento\Store\Model\Store;

/**
 * Gabarit d'habillage dont la sortie est mise en cache dans `block_html`.
 *
 * Deux raisons d'avoir une classe pour ça plutôt qu'un simple argument de
 * layout :
 *
 * 1. Magento ne met un bloc en cache que s'il déclare un `cache_lifetime` ;
 * 2. la clé par défaut (`AbstractBlock::getCacheKeyInfo()`) ne contient QUE le
 *    nom du bloc. Sur une installation multi-boutique, tous les store views
 *    partageraient donc la même entrée — et se retrouveraient avec l'entête du
 *    premier qui a rempli le cache.
 *
 * La clé est donc complétée par tout ce qui fait varier le rendu d'un habillage
 * à contenu identique pour tous les visiteurs :
 *
 * - le store view : libellés traduits, logo, URLs, blocs CMS du menu ;
 * - le thème appliqué, qu'une exception de design peut changer en cours de
 *   requête (thème mobile dédié, planification) ;
 * - le schéma de la requête, dont dépend ce que produit `getUrl()` ;
 * - la devise courante, qui est un choix du visiteur et non une propriété du
 *   store view.
 *
 * À réserver aux blocs dont la sortie est identique pour tous les visiteurs
 * d'un même store view. Sous Hyvä c'est le cas de l'entête : panier, compte et
 * wishlist y sont rendus côté client depuis les sections `customer-data`.
 */
class CacheableTemplate extends Template
{
    /**
     * @return string[]
     */
    public function getCacheKeyInfo(): array
    {
        $store = $this->_storeManager->getStore();

        $info = parent::getCacheKeyInfo();
        $info['store'] = (string)$store->getCode();
        $info['theme'] = (string)$this->_design->getDesignTheme()->getId();

        /* Ni la devise courante ni le schéma ne sont exposés par StoreInterface. */
        if ($store instanceof Store) {
            $info['currency'] = (string)$store->getCurrentCurrencyCode();
            $info['secure'] = (string)(int)$store->isCurrentlySecure();
        }

        return $info;
    }
}
