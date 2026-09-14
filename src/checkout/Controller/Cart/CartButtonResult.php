<?php

declare(strict_types=1);

namespace Satoshi\Checkout\Controller\Cart;

use Magento\Framework\Controller\ResultFactory;
use Magento\Framework\Controller\ResultInterface;
use Satoshi\Checkout\Block\Cart\Coupon;
use Satoshi\Theme\Block\Minicart;

/**
 * Lightweight response for the theme's asynchronous cart actions.
 *
 * The add to cart, quantity update and coupon requests sent by the theme's scripts only read
 * #cart-button (and #apply-coupon for the coupon) from the response, then reload the customer
 * sections. Following the redirect rendered the whole cart page for that. When the script flags
 * the request with the satoshi_cart_button parameter, render those blocks only. Plain form posts
 * (no script) keep the redirect.
 */
trait CartButtonResult
{
    /**
     * Request parameter set by the theme's scripts
     */
    private static string $cartButtonParam = 'satoshi_cart_button';

    /**
     * Whether the request comes from the theme's scripts and only needs the cart button
     *
     * @return bool
     */
    private function isCartButtonRequest(): bool
    {
        return (string) $this->getRequest()->getParam(self::$cartButtonParam) === '1';
    }

    /**
     * Render the cart button (with its session messages), and the coupon form if requested
     *
     * @param bool $withCoupon
     * @return ResultInterface
     */
    private function createCartButtonResult(bool $withCoupon = false): ResultInterface
    {
        $layout = $this->resultFactory->create(ResultFactory::TYPE_PAGE)->getLayout();
        $html = $layout->createBlock(Minicart::class)->toHtml();

        if ($withCoupon) {
            $html .= $layout->createBlock(Coupon::class)
                ->setTemplate('Magento_Theme::html/header/cart/coupon.phtml')
                ->toHtml();
        }

        return $this->resultFactory->create(ResultFactory::TYPE_RAW)->setContents($html);
    }
}
