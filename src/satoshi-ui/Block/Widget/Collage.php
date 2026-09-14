<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Helper\Image;
use Magento\Catalog\Model\Category as CategoryModel;
use Magento\Catalog\Model\Product as ProductModel;
use Magento\Customer\Model\Context as CustomerContext;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Data\Wysiwyg\Normalizer;
use Magento\Framework\DataObject\IdentityInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;
use Magento\Widget\Block\BlockInterface;

/**
 * Collage widget block
 */
class Collage extends Template implements BlockInterface, IdentityInterface
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::widgets/collage.phtml';

    /**
     * @var CategoryRepositoryInterface
     */
    private $categoryRepository;

    /**
     * @var ProductRepositoryInterface
     */
    private $productRepository;

    /**
     * @var Image
     */
    private $imageHelper;

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
     * @param  CategoryRepositoryInterface  $categoryRepository
     * @param  ProductRepositoryInterface  $productRepository
     * @param  Image  $imageHelper
     * @param  HttpContext  $httpContext
     * @param  Json|null  $serializer
     * @param  Normalizer|null  $normalizer
     * @param  array  $data
     */
    public function __construct(
        Context $context,
        CategoryRepositoryInterface $categoryRepository,
        ProductRepositoryInterface $productRepository,
        Image $imageHelper,
        HttpContext $httpContext,
        ?Json $serializer = null,
        ?Normalizer $normalizer = null,
        array $data = []
    ) {
        $this->categoryRepository = $categoryRepository ?? ObjectManager::getInstance()->get(CategoryRepositoryInterface::class);
        $this->productRepository = $productRepository ?? ObjectManager::getInstance()->get(ProductRepositoryInterface::class);
        $this->imageHelper = $imageHelper ?: ObjectManager::getInstance()->get(Image::class);
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
    public function getCollage()
    {
        return $this->getData('collage_items') ? $this->decode($this->getData('collage_items')) : [];
    }

    /**
     * @param $categoryId
     * @return array
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    public function getCategory($categoryId)
    {
        $category = $this->categoryRepository->get($categoryId, $this->_storeManager->getStore()->getId());

        // Image principale de la catégorie, avec repli sur la vignette (thumbnail) si absente.
        $image = $category->getImageUrl();
        if (!$image) {
            $image = $category->getImageUrl('thumbnail');
        }

        return [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'url' => $category->getUrl(),
            'image' => $image
        ];
    }

    /**
     * @param $productId
     * @return ProductInterface
     * @throws NoSuchEntityException
     */
    public function getProduct($productId)
    {
        return $this->productRepository->getById($productId);
    }

    /**
     * @param $product
     * @return array
     */
    public function getProductData($product)
    {
        return [
            'id' => $product->getId(),
            'name' => $product->getName(),
            'url' => $product->getProductUrl(),
            'image' => $this->imageHelper->init($product, 'product_page_image_medium')->getUrl()
        ];
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
     * Extends the template key (store, template, base URL): the collage renders prices, so the
     * key also varies on currency, customer group and tax rates.
     *
     * @return array
     */
    public function getCacheKeyInfo()
    {
        return array_merge(parent::getCacheKeyInfo(), [
            'SATOSHI_COLLAGE_WIDGET',
            $this->_storeManager->getStore()->getCurrentCurrencyCode(),
            $this->httpContext->getValue(CustomerContext::CONTEXT_GROUP),
            $this->serializer->serialize($this->httpContext->getValue('tax_rates')),
            $this->getData('collage_items')
        ]);
    }

    /**
     * Cache tags of the categories and products shown, so that saving one purges the widget
     *
     * @return string[]
     */
    public function getIdentities()
    {
        $identities = [];
        foreach ($this->getCollage() ?: [] as $item) {
            if (($item['item_type'] ?? '') === 'item_category') {
                if (!empty($item['item_category'])) {
                    $identities[] = CategoryModel::CACHE_TAG . '_' . $item['item_category'];
                }
            } elseif (!empty($item['item_product'])) {
                $identities[] = ProductModel::CACHE_TAG . '_' . $item['item_product'];
            }
        }

        return $identities;
    }
}
