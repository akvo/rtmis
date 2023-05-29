from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination


class Pagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "current": self.page.number,
                "total": self.page.paginator.count,
                "total_page": self.page.paginator.num_pages,
                "data": data,
            }
        )
