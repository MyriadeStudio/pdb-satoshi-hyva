<?php

declare(strict_types=1);

namespace Satoshi\Theme\Model;

use Magento\Framework\View\Element\BlockInterface;
use Magento\Framework\View\LayoutInterface;

/**
 * Stand-in for the $template, $popup and $resizable variables of the templates.
 *
 * SharedVariablesPlugin used to create these three blocks before every template rendering, although
 * about 80% of the templates never use them (430 to 620 blocks per page, each added to the layout
 * structure). The block is now created on the first method call, so a template keeps its own fresh block
 * as before, and a template that does not use the variable costs nothing.
 *
 * @mixin \Satoshi\Theme\Block\Template
 */
class LazyBlock
{
    /**
     * @var BlockInterface|null
     */
    private ?BlockInterface $block = null;

    /**
     * @param LayoutInterface $layout
     * @param string $blockClass
     */
    public function __construct(
        private readonly LayoutInterface $layout,
        private readonly string $blockClass
    ) {
    }

    /**
     * Forward the call to the block, created on first use
     *
     * @param string $method
     * @param array $arguments
     * @return mixed
     */
    public function __call(string $method, array $arguments)
    {
        $this->block ??= $this->layout->createBlock($this->blockClass);

        return $this->block->{$method}(...$arguments);
    }
}
