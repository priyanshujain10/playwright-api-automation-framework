/* eslint-disable playwright/no-conditional-in-test -- pairwise cases mix optional params; assertions only apply to the params each case actually sets */
import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

/**
 * Pairwise Testing — Product Search
 *
 * Technique: Pairwise / All-Pairs Testing
 * Principle: Cover every pair of parameter values in at least one test case.
 *            Reduces 54 exhaustive combinations to 9, while covering all
 *            two-way interactions between: category, size, color, inStock.
 *
 * Parameters:
 *   category : "Smartphones" | "Clothing" | "Electronics"
 *   size     : "128GB"       | "XL"       | null (omitted)
 *   color    : "Onyx Black"  | "Glacier Blue" | null (omitted)
 *   inStock  : true          | false
 *
 * Test matrix (OATS-derived, all pairs covered):
 *   PW-01: Smartphones  + 128GB + Onyx Black   + true
 *   PW-02: Smartphones  + XL    + Glacier Blue + false
 *   PW-03: Smartphones  + null  + null         + true
 *   PW-04: Clothing     + 128GB + Glacier Blue + true
 *   PW-05: Clothing     + XL    + null         + false
 *   PW-06: Clothing     + null  + Onyx Black   + false
 *   PW-07: Electronics  + 128GB + null         + false
 *   PW-08: Electronics  + XL    + Onyx Black   + true
 *   PW-09: Electronics  + null  + Glacier Blue + true
 */

type SearchParams = {
    category: string;
    size?: string;
    color?: string;
    inStock: boolean;
};

interface PairwiseCase {
    id: string;
    params: SearchParams;
}

const pairwiseCases: PairwiseCase[] = [
    { id: 'FKT-01', params: { category: 'Smartphones', size: '128GB', color: 'Onyx Black',   inStock: true  } },
    { id: 'FKT-02', params: { category: 'Smartphones', size: 'XL',    color: 'Glacier Blue', inStock: false } },
    { id: 'FKT-03', params: { category: 'Smartphones',                                        inStock: true  } },
    { id: 'FKT-04', params: { category: 'Clothing',    size: '128GB', color: 'Glacier Blue', inStock: true  } },
    { id: 'FKT-05', params: { category: 'Clothing',    size: 'XL',                           inStock: false } },
    { id: 'FKT-06', params: { category: 'Clothing',                   color: 'Onyx Black',   inStock: false } },
    { id: 'FKT-07', params: { category: 'Electronics', size: '128GB',                        inStock: false } },
    { id: 'FKT-08', params: { category: 'Electronics', size: 'XL',    color: 'Onyx Black',   inStock: true  } },
    { id: 'FKT-09', params: { category: 'Electronics',                color: 'Glacier Blue', inStock: true  } },
];

test.describe('Pairwise Testing — Product Search filter combinations', {
    tag: ['@Pairwise', '@PW', '@Product', '@API']
}, () => {

    for (const tc of pairwiseCases) {
        test(`[${tc.id}] Search: ${JSON.stringify(tc.params)}`, {
            tag: [`@${tc.id}`, '@Regression', '@Pairwise']
        }, async ({ productController }) => {
            logger.info(`${tc.id}: searchProducts with params=${JSON.stringify(tc.params)}`);

            const response = await productController.searchProducts(tc.params);
            const body = await response.json();

            logger.info(`${tc.id}: status=${response.status()} resultCount=${body.data?.length ?? 'n/a'}`);

            // The search endpoint must respond successfully for any valid combination
            expect(response.status(), `${tc.id} should return 200`).toBe(200);
            expect(body.success).toBe(true);
            expect(Array.isArray(body.data), 'Response data should be an array').toBe(true);

            // When inStock=true, every returned item must be in stock
            if (tc.params.inStock === true) {
                body.data.forEach((product: { inStock: boolean; id: string }) => {
                    expect(
                        product.inStock,
                        `${tc.id}: product ${product.id} should be in stock when inStock=true filter applied`
                    ).toBe(true);
                });
            }

            // When category is specified, every returned item must match that category
            if (tc.params.category) {
                body.data.forEach((product: { category: string; id: string }) => {
                    expect(
                        product.category,
                        `${tc.id}: product ${product.id} category mismatch`
                    ).toBe(tc.params.category);
                });
            }

            // When color is specified, every returned item must match that color or have that color variant
            if (tc.params.color) {
                body.data.forEach((product: { variants: { color: string }[]; id: string }) => {
                    const hasColor = product.variants.some(v => v.color === tc.params.color);
                    expect(
                        hasColor,
                        `${tc.id}: product ${product.id} should have color variant ${tc.params.color}`
                    ).toBe(true);
                });
            }

            // When size is specified, every returned item must have that size variant
            if (tc.params.size) {
                body.data.forEach((product: { variants: { size: string }[]; id: string }) => {
                    const hasSize = product.variants.some(v => v.size === tc.params.size);
                    expect(
                        hasSize,
                        `${tc.id}: product ${product.id} should have size variant ${tc.params.size}`
                    ).toBe(true);
                });
            }
        });
    }
});

// ─── Pair coverage audit (non-executable documentation) ──────────────────────
/**
 * Covered pairs verified against the matrix above:
 *
 * (category × size):    (W,128GB)✓ (W,US9)✓ (W,null)✓ (Sh,128GB)✓ (Sh,US9)✓ (Sh,null)✓ (Ac,128GB)✓ (Ac,US9)✓ (Ac,null)✓
 * (category × color):   (W,Blk)✓  (W,Wht)✓  (W,null)✓  (Sh,Wht)✓  (Sh,Blk)✓  (Sh,null)✓  (Ac,null)✓  (Ac,Blk)✓  (Ac,Wht)✓
 * (category × inStock): (W,T)✓ (W,F)✓ (Sh,T)✓ (Sh,F)✓ (Ac,F)✓ (Ac,T)✓
 * (size × color):       (128GB,Blk)✓ (US9,Wht)✓ (null,null)✓ (128GB,Wht)✓ (US9,null)✓ (null,Blk)✓ (128GB,null)✓ (US9,Blk)✓ (null,Wht)✓
 * (size × inStock):     (128GB,T)✓ (US9,F)✓ (null,T)✓ (128GB,T)✓ (US9,F)✓ (null,F)✓ (128GB,F)✓ (US9,T)✓ (null,T)✓
 * (color × inStock):    (Blk,T)✓ (Wht,F)✓ (null,T)✓ (Wht,T)✓ (null,F)✓ (Blk,F)✓ (null,F)✓ (Blk,T)✓ (Wht,T)✓
 *
 * All 6 parameter pairs fully covered. ✓
 */
