<?php

declare(strict_types=1);

namespace Satoshi\Theme\Plugin\TemplateEngine;

use Magento\Framework\View\Element\BlockInterface;
use Magento\Framework\View\TemplateEngine\Php;
use Satoshi\Theme\Block\Popup;
use Satoshi\Theme\Block\Resizable;
use Satoshi\Theme\Block\Template;
use Satoshi\Theme\Model\LazyBlock;

class SharedVariablesPlugin
{
  /**
   * @param Php $subject
   * @param BlockInterface $block
   * @param $filename
   * @param mixed[] $dictionary
   * @return mixed[]
   *
   * Assign template variables that are available in all templates. The blocks are only created when a
   * template calls them (see LazyBlock).
   */
  public function beforeRender(Php $subject, BlockInterface $block, $filename, array $dictionary = [])
  {
    $layout = $block->getLayout();
    $dictionary['resizable'] = new LazyBlock($layout, Resizable::class);
    $dictionary['popup'] = new LazyBlock($layout, Popup::class);
    $dictionary['template'] = new LazyBlock($layout, Template::class);

    return [$block, $filename, $dictionary];
  }
}
