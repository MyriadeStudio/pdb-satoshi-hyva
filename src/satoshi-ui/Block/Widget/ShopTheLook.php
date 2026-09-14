<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Model\Product as ProductModel;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;
use Magento\Customer\Model\Context as CustomerContext;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Data\Wysiwyg\Normalizer;
use Magento\Framework\DataObject;
use Magento\Framework\DataObject\IdentityInterface;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;
use Magento\Widget\Block\BlockInterface;

/**
 * Shop the look widget block
 */
class ShopTheLook extends Template implements BlockInterface, IdentityInterface
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::widgets/shop-the-look.phtml';

    /**
     * @var CollectionFactory
     */
    private $collectionFactory;

    /**
     * @var Json
     */
    private $serializer;

    /**
     * @var Normalizer
     */
    private $normalizer;

    /**
     * @var HttpContext
     */
    private $httpContext;

    /**
     * @param  Context  $context
     * @param  CollectionFactory  $collectionFactory
     * @param  HttpContext  $httpContext
     * @param  Json|null  $serializer
     * @param  Normalizer|null  $normalizer
     * @param  array  $data
     */
    public function __construct(
        Context $context,
        CollectionFactory $collectionFactory,
        HttpContext $httpContext,
        ?Json $serializer = null,
        ?Normalizer $normalizer = null,
        array $data = []
    ) {
        $this->collectionFactory = $collectionFactory ?? ObjectManager::getInstance()->get(CollectionFactory::class);
        $this->httpContext = $httpContext;
        $this->serializer = $serializer ?: ObjectManager::getInstance()->get(Json::class);
        $this->normalizer = $normalizer ?: ObjectManager::getInstance()->get(Normalizer::class);
        parent::__construct(
            $context,
            $data
        );
    }

    /**
     * @return array|bool|float|int|mixed|string|null
     */
    public function getProducts()
    {
        return $this->getData('products') ? $this->decode($this->getData('products')) : [];
    }

    /**
     * @return DataObject[]
     */
    public function getProductsData()
    {
        $products = $this->getProducts();
        $collection = $this->collectionFactory->create();
        $collection->addAttributeToSelect('*')
            ->addFieldToFilter('status', \Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
            ->addIdFilter(array_map(fn($product) => $product['product_id'], $products));

        return $collection->getItems();
    }

    /**
     * @return array|bool|float|int|mixed|string|null
     */
    public function getImage()
    {
        return $this->getData('image') ? $this->decode($this->getData('image')) : [];
    }

    /**
     * @return array|bool|float|int|mixed|string|null
     */
    public function getMobileImage()
    {
        return $this->getData('mobile_image') ? $this->decode($this->getData('mobile_image')) : [];
    }

    /**
     * @param $value
     * @return array|bool|float|int|mixed|string|null
     */
    public function decode($value)
    {
        return $this->serializer->unserialize(
            $this->normalizer->restoreReservedCharacters($value)
        );
    }

    /**
     * @return bool|int|null
     */
    protected function getCacheLifetime()
    {
        return parent::getCacheLifetime() ?: 3600;
    }

    /**
     * Extends the template key (store, template, base URL): the product cards render prices, so
     * the key also varies on currency, customer group and tax rates.
     *
     * @return array
     */
    public function getCacheKeyInfo()
    {
        return array_merge(parent::getCacheKeyInfo(), [
            'SATOSHI_SHOP_THE_LOOK_WIDGET',
            $this->_storeManager->getStore()->getCurrentCurrencyCode(),
            $this->httpContext->getValue(CustomerContext::CONTEXT_GROUP),
            $this->serializer->serialize($this->httpContext->getValue('tax_rates')),
            $this->getData('heading'),
            $this->getData('image'),
            $this->getData('mobile_image'),
            $this->getData('products'),
            $this->getData('text_color_scheme')
        ]);
    }

    /**
     * Cache tags of the products shown, so that saving one purges the widget
     *
     * @return string[]
     */
    public function getIdentities()
    {
        $identities = [];
        foreach ($this->getProducts() ?: [] as $product) {
            if (!empty($product['product_id'])) {
                $identities[] = ProductModel::CACHE_TAG . '_' . $product['product_id'];
            }
        }

        return $identities;
    }
}
