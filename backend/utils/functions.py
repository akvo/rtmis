def update_date_time_format(date):
    if date:
        # date = timezone.datetime.strptime(date, "%Y-%m-%d").date()
        return date.date().strftime('%B %d, %Y')
    return None
