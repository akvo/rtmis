class JobTypes:
    send_email = 1
    validate_data = 2
    seed_data = 3
    download = 4

    FieldStr = {
        send_email: 'send_email',
        validate_data: 'validate_data',
        seed_data: 'seed_data',
        download: 'download',
    }


class JobStatus:
    pending = 1
    on_progress = 2
    failed = 3
    done = 4

    FieldStr = {
        pending: 'pending',
        on_progress: 'on_progress',
        failed: 'failed',
        done: 'done',
    }
