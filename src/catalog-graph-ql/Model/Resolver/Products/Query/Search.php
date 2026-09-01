<?php

declare(strict_types=1);

namespace Satoshi\CatalogGraphQl\Model\Resolver\Products\Query;

use Magento\AdvancedSearch\Model\Client\ClientException;
use Magento\CatalogGraphQl\Model\Resolver\Products\Query\FieldSelection;
use Magento\CatalogGraphQl\Model\Resolver\Products\Query\ProductQueryInterface;
use Magento\CatalogGraphQl\Model\Resolver\Products\Query\Suggestions;
use Magento\CatalogGraphQl\DataProvider\Product\SearchCriteriaBuilder;
use Magento\CatalogGraphQl\Model\Resolver\Products\DataProvider\ProductSearch;
use Magento\CatalogGraphQl\Model\Resolver\Products\Query\Search\QueryPopularity;
use Magento\CatalogGraphQl\Model\Resolver\Products\SearchResult;
use Magento\CatalogGraphQl\Model\Resolver\Products\SearchResultFactory;
use Magento\Framework\Api\Search\SearchCriteriaInterface;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Query\Resolver\ArgumentsProcessorInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\GraphQl\Model\Query\ContextInterface;
use Magento\Search\Api\SearchInterface;
use Magento\Search\Model\Search\PageSizeProvider;

class Search implements ProductQueryInterface
{
    /**
     * @var SearchInterface
     */
    private $search;

    /**
     * @var SearchResultFactory
     */
    private $searchResultFactory;

    /**
     * @var PageSizeProvider
     */
    private $pageSizeProvider;

    /**
     * @var FieldSelection
     */
    private $fieldSelection;

    /**
     * @var ArgumentsProcessorInterface
     */
    private $argsSelection;

    /**
     * @var ProductSearch
     */
    private $productsProvider;

    /**
     * @var SearchCriteriaBuilder
     */
    private $searchCriteriaBuilder;

    /**
     * @var Suggestions
     */
    private $suggestions;

    /**
     * @var QueryPopularity
     */
    private $queryPopularity;

    /**
     * @param SearchInterface $search
     * @param SearchResultFactory $searchResultFactory
     * @param PageSizeProvider $pageSize
     * @param FieldSelection $fieldSelection
     * @param ProductSearch $productsProvider
     * @param SearchCriteriaBuilder $searchCriteriaBuilder
     * @param ArgumentsProcessorInterface $argsSelection
     * @param Suggestions $suggestions
     * @param QueryPopularity $queryPopularity
     */
    public function __construct(
        SearchInterface $search,
        SearchResultFactory $searchResultFactory,
        PageSizeProvider $pageSize,
        FieldSelection $fieldSelection,
        ProductSearch $productsProvider,
        SearchCriteriaBuilder $searchCriteriaBuilder,
        ArgumentsProcessorInterface $argsSelection,
        Suggestions $suggestions,
        QueryPopularity $queryPopularity
    ) {
        $this->search = $search;
        $this->searchResultFactory = $searchResultFactory;
        $this->pageSizeProvider = $pageSize;
        $this->fieldSelection = $fieldSelection;
        $this->productsProvider = $productsProvider;
        $this->searchCriteriaBuilder = $searchCriteriaBuilder;
        $this->argsSelection = $argsSelection;
        $this->suggestions = $suggestions;
        $this->queryPopularity = $queryPopularity;
    }

    /**
     * Extended to always return suggestions if requested
     *
     * @param array $args
     * @param ResolveInfo $info
     * @param ContextInterface $context
     * @return SearchResult
     * @throws GraphQlInputException
     */
    public function getResult(
        array $args,
        ResolveInfo $info,
        ContextInterface $context
    ): SearchResult {
        try {
            $searchCriteria = $this->buildSearchCriteria($args, $info);

            $realPageSize = $searchCriteria->getPageSize();
            $realCurrentPage = $searchCriteria->getCurrentPage();
            // Because of limitations of sort and pagination on Search API, query all IDs first.
            $searchCriteria->setPageSize($this->pageSizeProvider->getMaxPageSize());
            $searchCriteria->setCurrentPage(0);
            $itemsResults = $this->search->search($searchCriteria);

            // Apply the original GraphQL pagination when loading the products.
            $searchCriteria->setPageSize($realPageSize);
            $searchCriteria->setCurrentPage($realCurrentPage);
            $searchResults = $this->productsProvider->getList(
                $searchCriteria,
                $itemsResults,
                $this->fieldSelection->getProductsFieldSelection($info),
                $context
            );

            $totalPages = $realPageSize ? ((int) ceil($searchResults->getTotalCount() / $realPageSize)) : 0;

            if (!empty($args['search'])) {
                $this->queryPopularity->execute($context, $args['search'], (int) $searchResults->getTotalCount());
            }

            $productArray = [];
            /** @var \Magento\Catalog\Model\Product $product */
            foreach ($searchResults->getItems() as $product) {
                $productArray[$product->getId()] = $product->getData();
                $productArray[$product->getId()]['model'] = $product;
            }

            $suggestions = [];
            $totalCount = (int) $searchResults->getTotalCount();
            if (!empty($args['search'])) {
                $suggestions = $this->suggestions->execute($context, $args['search']);
            }

            return $this->searchResultFactory->create(
                [
                    'totalCount' => $totalCount,
                    'productsSearchResult' => $productArray,
                    'searchAggregation' => $itemsResults->getAggregations(),
                    'pageSize' => $realPageSize,
                    'currentPage' => $realCurrentPage,
                    'totalPages' => $totalPages,
                    'suggestions' => $suggestions,
                ]
            );
        } catch (\InvalidArgumentException | ClientException) {
            return $this->createEmptySearchResult($args);
        }
    }

    /**
     * Return a valid GraphQL result when the search engine rejects a query.
     */
    private function createEmptySearchResult(array $args): SearchResult
    {
        return $this->searchResultFactory->create(
            [
                'totalCount' => 0,
                'productsSearchResult' => [],
                'searchAggregation' => null,
                'pageSize' => (int) ($args['pageSize'] ?? 0),
                'currentPage' => (int) ($args['currentPage'] ?? 0),
                'totalPages' => 0,
                'suggestions' => [],
            ]
        );
    }

    /**
     * Build search criteria from query input args
     *
     * @param array $args
     * @param ResolveInfo $info
     * @return SearchCriteriaInterface
     */
    private function buildSearchCriteria(array $args, ResolveInfo $info): SearchCriteriaInterface
    {
        $productFields = (array)$info->getFieldSelection(1);
        $includeAggregations = isset($productFields['filters']) || isset($productFields['aggregations']);
        $fieldName = $info->fieldName ?? "";
        $processedArgs = $this->argsSelection->process((string) $fieldName, $args);
        $searchCriteria = $this->searchCriteriaBuilder->build($processedArgs, $includeAggregations);

        return $searchCriteria;
    }
}
