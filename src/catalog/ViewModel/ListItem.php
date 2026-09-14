<?php

namespace Satoshi\Catalog\ViewModel;

use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Framework\View\Element\AbstractBlock;
use Magento\Framework\View\Element\Block\ArgumentInterface;

class ListItem implements ArgumentInterface
{
    /**
     * @param AbstractBlock $renderer
     * @param ProductInterface $product
     * @param bool $isReadonly
     *
     * @return string
     */
    public function getProductDetailsHtml(
        AbstractBlock $renderer,
        ProductInterface $product,
        bool $isReadonly = false
    ) {
        $renderer->setProduct($product);
        $renderer->setIsReadonly($isReadonly);

        return $renderer->toHtml();
    }
}
